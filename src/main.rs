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
    extract::
        ws::{Message, WebSocket}
    ,
    routing::post,
    Router,
};
use futures_util::{Future, SinkExt, StreamExt};
use game::Color;
use game_messages::Request;
use lobby::{Lobby, LobbyData};
use log::info;
use parking_lot::Mutex;
use serde::Serialize;
use tokio::{
    net::TcpListener,
    select,
    sync::{mpsc, oneshot},
};

use tower_http::trace::TraceLayer;
use uuid::Uuid;
type PlayerId = usize;

use tracing;
use tracing_subscriber;

static SESSION_TOKEN: &str = "SESSION_TOKEN_I_FKN_LOVE_WEB_DEV_YIPPEEE";
#[derive(Default)]
struct AppState {
    lobbies: HashMap<Uuid, Lobby>,
    users: HashMap<Uuid, Arc<str>>,
    taken_user_names: HashSet<String>,
}



mod lobby;
mod user;

impl AppState {
    /// Adds a new new user if the name is free. Returns the user's generated Uuid on success
    fn new_user(&mut self, name: String) -> Option<Uuid> {
        info!("new_user: {name}");
        (!self.taken_user_names.contains(&name)).then(|| {
            let id = Uuid::new_v4();
            self.taken_user_names.insert(name.clone());
            self.users.insert(id, name.into());
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
        Arc<str>,
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

        .nest("/user", user::routes()).nest("/lobbies", lobby::routes())
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





async fn handle_socket(socket: WebSocket, tx: mpsc::Sender<Command>, user_name: Arc<str>) {
    let (oneshot_tx, oneshot_rx) = oneshot::channel();

    tx.send(Command::Join(user_name, oneshot_tx)).await.unwrap();
    let res = oneshot_rx.await.unwrap();
    let Ok((self_id, mut room_rx)) = res else {
        socket.close().await.unwrap();
        return;
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
