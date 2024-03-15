use crate::{game::*, user::User};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
#[derive(Clone, Debug, TS, Deserialize)]
#[ts(export)]
#[serde(tag = "tag", content = "fields")]
pub enum Request {
    PlaySpecialCard(usize, Color),
    PlayCards(Vec<usize>),
    TakeCard,
    SendMessage { content: String },
}

#[derive(Clone, Debug, TS, Serialize)]
#[ts(export)]
#[serde(tag = "tag", content = "fields")]
pub enum Response<'a> {
    ChatMessage(ChatMessage<'a>),
    GameState(GameState<'a>),
    // Error(String),
}

#[derive(Clone, Debug, TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage<'a> {
    pub content: &'a str,
    pub user_name: &'a str,
}

#[derive(Clone, Debug, TS, Serialize)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct GameState<'a> {
    pub users: &'a [PlayerInfo<'a>],
    pub direction: TurnDirection,
    pub own_cards: &'a [Card],
    pub turn_index: usize,
    pub top_card: Option<&'a Card>,
    pub self_index: usize,
    pub cards_played: usize,
}

#[derive(Clone, Debug, TS, Serialize)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct PlayerInfo<'a> {
    pub user: &'a User,
    pub card_count: usize,
}

