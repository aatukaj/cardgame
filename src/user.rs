use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::{
    cookie::{Cookie, Expiration, SameSite},
    CookieJar,
};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{token_extractor::SessionToken, SharedState, SESSION_TOKEN};


#[derive(Deserialize, Serialize, Clone, Debug, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct User {
    pub name: String,
    pub tie_index: usize,
    pub tie_color_index: usize,
    pub eye_index: usize,
    pub eye_color_index: usize,
}

async fn login(
    jar: CookieJar,
    State(state): State<SharedState>,
    Json(input): Json<User>,
) -> Result<CookieJar, (StatusCode, &'static str)> {
    if let Some(id) = state.lock().new_user(input) {
        let cookie = Cookie::build((SESSION_TOKEN, id.to_string()))
            .expires(Expiration::Session)
            .http_only(false)
            .same_site(SameSite::Lax)
            .path("/")
            .secure(false);

        Ok(jar.add(cookie))
    } else {
        Err((StatusCode::BAD_REQUEST, "Username already exists"))
    }
}


async fn whoami(
    SessionToken(token): SessionToken,
    State(state): State<SharedState>,
) -> Result<Json<User>, StatusCode> {
    state
        .lock()
        .users
        .get(&token)
        .map(|n| {
            Json(n.as_ref().clone())
        })
        .ok_or(StatusCode::UNAUTHORIZED)
}

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route("/login", post(login))
        .route("/whoami", get(whoami))
}
