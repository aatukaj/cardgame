pub mod game;
mod messages;
mod room;

use std::{collections::HashMap, env, io::Error, sync::Arc};

use axum::{
    extract::{
        ws::{Message, WebSocket},
        Path, State, WebSocketUpgrade,
    },
    http::{header::CONTENT_TYPE, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use futures_util::{future::join_all, SinkExt, StreamExt, TryFutureExt};
use game::Color;
use log::{error, info};
use messages::Request;
use room::RoomActor;
use serde::{Deserialize, Serialize};
use tokio::{
    net::TcpListener,
    select,
    sync::{mpsc, oneshot, Mutex},
};
use uuid::Uuid;
type PlayerId = usize;

use tower_http::cors::{Any, CorsLayer};
use ts_rs::TS;

#[derive(Default)]
struct AppState {
    lobbies: HashMap<Uuid, mpsc::Sender<Command>>,
}
impl AppState {
    async fn collect_lobby_data(&mut self) -> Vec<LobbyData> {
        let lobby_data = join_all(self.lobbies.values().map(|tx| {
            let (sender, receiver) = oneshot::channel();
            tx.send(Command::GetData(sender))
                .map_err(|_| ())
                .and_then(|_| receiver.map_err(|_| ()))
        }))
        .await;
        let lobby_data = lobby_data
            .into_iter()
            .filter_map(|d| d.ok())
            .collect::<Vec<_>>();
        lobby_data
    }
}
type SharedState = Arc<Mutex<AppState>>;
pub enum Command {
    SendMessage(PlayerId, String),
    Join(oneshot::Sender<Result<(PlayerId, mpsc::Receiver<String>), String>>),
    GetData(oneshot::Sender<LobbyData>),
    Leave(PlayerId),
    PlayCard(PlayerId, usize, Color),
    TakeCard(PlayerId),
    Shutdown,
    Noop,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    env_logger::builder()
        .filter_level(log::LevelFilter::Debug)
        .try_init()
        .unwrap();
    let addr = env::args()
        .nth(1)
        .unwrap_or_else(|| "127.0.0.1:8080".to_string());

    // Create the event loop and TCP listener we'll accept connections on.
    let listener = TcpListener::bind(&addr).await.unwrap();
    info!("Listening on: {}", addr);

    let state = SharedState::default();
    for name in [
        "bob", "lobby1", "null", "lmao", "bob2", "lobby12", "null2", "lmao", "bfob", "lobby1f",
        "fnull", "lmfao", "bobf2", "lfobby12", "nulfl2", "lmaof",
    ] {
        let (tx, id) = RoomActor::spawn_new(name.into(), 6);
        state.lock().await.lobbies.insert(id, tx);
    }

    let app = Router::new()
        .route("/join/:id", get(lobby_join))
        .route("/lobbies", get(lobbies_list).post(lobbies_create))
        .with_state(state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_headers([CONTENT_TYPE]),
        );
    axum::serve(listener, app).await.unwrap();
    Ok(())
}

trait Ser: Serialize {
    fn ser(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
}
impl<T> Ser for T where T: Serialize {}

#[derive(Deserialize, Debug, TS)]
#[ts(export)]
struct CreateLobbyData {
    name: String,
    max_players: usize,
}

async fn lobbies_create(
    State(state): State<SharedState>,
    Json(input): Json<CreateLobbyData>,
) -> Response {
    info!("New lobby {input:?}");
    if input.name.is_empty() {
        return (StatusCode::BAD_REQUEST, "Lobby name cannot be empty.").into_response()
    }
    if state.lock().await.collect_lobby_data().await.iter().any(|i| i.name == input.name) {
        return (StatusCode::BAD_REQUEST, "Lobby name already exists.").into_response()
    }
    let (tx, id) = RoomActor::spawn_new(input.name, input.max_players);
    state.lock().await.lobbies.insert(id, tx);
    (StatusCode::CREATED, Json(id)).into_response()
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct LobbyData {
    name: String,
    players: usize,
    max_players: usize,
    id: Uuid,
}

async fn lobbies_list(State(state): State<SharedState>) -> Json<Vec<LobbyData>> {
    let lobby_data = state.lock().await.collect_lobby_data().await;
    Json(lobby_data)
}

async fn lobby_join(
    State(state): State<SharedState>,
    ws: WebSocketUpgrade,
    Path(id): Path<Uuid>,
) -> Response {
    let tx = match state.lock().await.lobbies.get(&id) {
        Some(tx) => tx.clone(),
        None => return (StatusCode::NOT_FOUND, "Lobby doesn't exist").into_response(),
    };
    ws.on_upgrade(move |socket| handle_socket(socket, tx))
}

async fn handle_socket(socket: WebSocket, tx: mpsc::Sender<Command>) {
    let (oneshot_tx, oneshot_rx) = oneshot::channel();

    tx.send(Command::Join(oneshot_tx)).await.unwrap();
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
                    v => error!("weird data: {v:?}")
                }
            }
            Some(msg) = room_rx.recv() => {
                info!("Response: {msg:?}");
                write.send(Message::Text(msg)).await.unwrap();
            }
        }
    }
    tx.send(Command::Leave(self_id)).await.unwrap();
}
