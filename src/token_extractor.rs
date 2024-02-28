use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use axum_extra::extract::CookieJar;
use tracing::debug;
use uuid::Uuid;

use crate::SESSION_TOKEN;
pub struct SessionToken(pub Uuid);

#[async_trait]
impl<S> FromRequestParts<S> for SessionToken
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let cookie_jar = CookieJar::from_request_parts(parts, state).await.unwrap();
        debug!("Cookies: {:?}", cookie_jar);
        cookie_jar
            .get(SESSION_TOKEN)
            .and_then(|session_cookie| {
                
                Uuid::parse_str(session_cookie.value())
                    .map(SessionToken)
                    .ok()
            })
            .ok_or(StatusCode::UNAUTHORIZED)
    }
}
