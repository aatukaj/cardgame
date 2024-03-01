use axum_extra::extract::{cookie::{Cookie, Expiration, SameSite}, CookieJar};
use serde::{Deserialize, Serialize};
use axum::{extract::State, http::StatusCode, routing::{get, post}, Json, Router};
use ts_rs::TS;

use crate::{token_extractor::SessionToken, SharedState, SESSION_TOKEN};

#[derive(Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
struct LoginData {
    user_name: String,
}

async fn login(
    jar: CookieJar,
    State(state): State<SharedState>,
    Json(input): Json<LoginData>,
) -> Result<CookieJar, (StatusCode, &'static str)> {
    if let Some(id) = state.lock().new_user(input.user_name) {
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

#[derive(Serialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
struct UserInfo {
    user_name: String
}


async fn whoami(
    SessionToken(token): SessionToken,
    State(state): State<SharedState>,
) -> Result<Json<UserInfo>, StatusCode> {
    state.lock().users.get(&token).map(|n| Json(UserInfo {
        user_name: n.to_string()
    })).ok_or(StatusCode::UNAUTHORIZED)
}

pub fn routes() -> Router<SharedState> {
    Router::new().route("/login", post(login)).route("/whoami", get(whoami))
}