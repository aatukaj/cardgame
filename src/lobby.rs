use std::sync::Arc;

use axum::{
    extract::{Path, State, WebSocketUpgrade},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tracing::info;
use ts_rs::TS;
use uuid::Uuid;

use crate::{handle_socket, room::RoomActor, token_extractor::SessionToken, Command, SharedState};

#[derive(Deserialize, Debug, TS)]
#[ts(export)]
struct CreateLobbyData {
    name: String,
    max_players: usize,
}

pub struct Lobby {
    pub tx: mpsc::Sender<Command>,
    pub owner: Uuid,
}

async fn lobbies_create(
    SessionToken(token): SessionToken,
    State(state): State<SharedState>,
    Json(input): Json<CreateLobbyData>,
) -> Response {
    info!("New lobby {input:?}");
    if input.name.is_empty() {
        return (StatusCode::BAD_REQUEST, "Lobby name cannot be empty.").into_response();
    }
    let fut = state.lock().collect_lobby_data();
    if fut.await.iter().any(|i| i.name == input.name) {
        return (StatusCode::BAD_REQUEST, "Lobby name already exists.").into_response();
    }
    let (tx, id) = RoomActor::spawn_new(input.name, input.max_players);
    state.lock().lobbies.insert(id, Lobby { tx, owner: token });
    (StatusCode::CREATED, Json(id)).into_response()
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct LobbyData {
    pub name: String,
    pub players: usize,
    pub max_players: usize,
    pub id: Uuid,
}

async fn lobbies_list(State(state): State<SharedState>) -> Json<Vec<LobbyData>> {
    let lobby_data = state.lock().collect_lobby_data();
    Json(lobby_data.await)
}

async fn lobby_join(
    SessionToken(token): SessionToken,
    State(state): State<SharedState>,
    ws: WebSocketUpgrade,
    Path(id): Path<Uuid>,
) -> Response {
    let tx = match state.lock().lobbies.get(&id) {
        Some(lobby) => lobby.tx.clone(),
        None => return (StatusCode::NOT_FOUND, "Lobby doesn't exist").into_response(),
    };
    let Some(user) = state.lock().users.get(&token).map(Arc::clone) else {
        return (StatusCode::UNAUTHORIZED).into_response();
    };
    ws.on_upgrade(move |socket| handle_socket(socket, tx, user))
}

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route("/join/:id", get(lobby_join))
        .route("/", get(lobbies_list).post(lobbies_create))
}
