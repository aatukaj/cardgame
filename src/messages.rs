use std::borrow::Cow;

use crate::game::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;
#[derive(Clone, Debug, TS, Serialize, Deserialize)]
#[ts(export)]
#[serde(tag = "tag", content = "fields")]
pub enum Request {
    PlayCard(usize),
    SendMessage { content: String },
}

#[derive(Clone, Debug, TS, Serialize)]
#[ts(export)]
#[serde(tag = "tag", content = "fields")]
pub enum Response<'a> {
    ChatMessage(ChatMessage<'a>),
    GameState(GameState<'a>),
}

#[derive(Clone, Debug, TS, Serialize)]
#[ts(export)]
pub struct ChatMessage<'a> {
    pub content: Cow<'a, str>,
    pub user_name: Cow<'a, str>,
}

#[derive(Clone, Debug, TS, Serialize)]
#[ts(export)]
pub struct GameState<'a> {
    pub users: &'a Vec<UserData<'a>>,
    pub own_cards: &'a Vec<Card>,
    pub turn_index: usize,
    pub top_card: Option<&'a Card>,
    pub self_index: usize,
}

#[derive(Clone, Debug, TS, Serialize)]
#[ts(export)]
pub struct UserData<'a> {
    pub user_name: &'a str,
    pub card_count: usize,
}
