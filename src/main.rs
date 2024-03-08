pub mod game;
mod game_messages;
mod room;
mod token_extractor;
use std::{
    collections::{HashMap, HashSet},
    io::Error,
    sync::Arc,
};

use axum::{
    extract::ws::{CloseFrame, Message, WebSocket},
    Router,
};
use futures_util::{Future, SinkExt, StreamExt};
use game::Color;
use game_messages::Request;
use lobby::{Lobby, LobbyData};
use parking_lot::Mutex;
use serde::Serialize;
use tokio::{
    net::TcpListener,
    select,
    sync::{mpsc, oneshot},
};
use tower_http::trace::TraceLayer;
use user::User;
use uuid::Uuid;
type PlayerId = usize;

use tracing::{self, info};
use tracing_subscriber;

static SESSION_TOKEN: &str = "SESSION_TOKEN";
#[derive(Default)]
struct AppState {
    lobbies: HashMap<Uuid, Lobby>,
    users: HashMap<Uuid, Arc<User>>,
    taken_user_names: HashSet<String>,
}

mod lobby;
mod user;

impl AppState {
    /// Adds a new new user if the name is free. Returns the user's generated `Uuid` on success
    fn new_user(&mut self, user: User) -> Option<Uuid> {
        info!("new_user: {}", user.name);
        (!self.taken_user_names.contains(&user.name)).then(|| {
            let id = Uuid::new_v4();
            self.taken_user_names.insert(user.name.clone());
            self.users.insert(id, Arc::new(user));
            id
        })
    }
    fn collect_lobby_data(&mut self) -> impl Future<Output = Vec<LobbyData>> + Send {
        let senders = self
            .lobbies
            .values()
            .map(|l| l.tx.clone())
            .collect::<Vec<_>>();
        async move {
            let mut results = Vec::new();
            for lobby_tx in senders.into_iter() {
                let (sender, receiver) = oneshot::channel();
                lobby_tx.send(Command::GetData(sender)).await.unwrap();
                results.push(receiver.await.unwrap())
            }
            results
        }
    }
}

type SharedState = Arc<Mutex<AppState>>;
pub enum Command {
    SendMessage(PlayerId, String),
    Join(
        Arc<User>,
        oneshot::Sender<Result<(PlayerId, mpsc::Receiver<String>), String>>,
    ),
    GetData(oneshot::Sender<LobbyData>),
    Leave(PlayerId),
    PlayCard(PlayerId, usize, Color),
    TakeCard(PlayerId),
    Shutdown,
    Noop,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    // Create the event loop and TCP listener we'll accept connections on.
    let listener = TcpListener::bind("localhost:8080").await.unwrap();

    let state = SharedState::default();

    let app = Router::new()
        .nest("/user", user::routes())
        .nest("/lobbies", lobby::routes())
        .with_state(state)
        .layer(TraceLayer::new_for_http());
    axum::serve(listener, app).await.unwrap();
    Ok(())
}

trait Ser: Serialize {
    fn ser(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
}
impl<T> Ser for T where T: Serialize {}

async fn handle_socket(mut socket: WebSocket, tx: mpsc::Sender<Command>, user: Arc<User>) {
    let (oneshot_tx, oneshot_rx) = oneshot::channel();

    tx.send(Command::Join(user, oneshot_tx)).await.unwrap();
    let res = oneshot_rx.await.unwrap();

    let (self_id, mut room_rx) = match res {
        Ok(t) => t,
        Err(err) => {
            socket
                .send(Message::Close(Some(CloseFrame {
                    code: 1011,
                    reason: err.into(),
                })))
                .await
                .unwrap();
            return;
        }
    };

    let (mut write, mut read) = socket.split();
    loop {
        select! {
            Some(Ok(msg)) = read.next() => {
                info!("Request: {msg:?}");
                match msg {
                    Message::Text(txt) => {
                        let Ok(i) = serde_json::from_str::<Request>(&txt) else {break;};
                        tx.send(match i {
                            Request::SendMessage{content} => Command::SendMessage(self_id, content),
                            Request::PlayCard(i, c) => Command::PlayCard(self_id, i, c),
                            Request::TakeCard => Command::TakeCard(self_id),
                        }).await.unwrap();
                    },
                    Message::Close(_) => {
                        break;
                    }
                    _ => ()
                }
            }
            Some(msg) = room_rx.recv() => {
                write.send(Message::Text(msg)).await.unwrap();
            }
        }
    }
    tx.send(Command::Leave(self_id)).await.unwrap();
}
