use super::{Card, State};

#[derive(Debug)]
pub struct Player {
    pub cards: Vec<Card>,
    pub tx: tokio::sync::mpsc::Sender<String>,
    pub user_name: String,
}
impl Player {
    pub fn can_play_card(&self, state: &State) -> bool {
        self.cards.iter().any(|c| state.can_play(c))
    }
}