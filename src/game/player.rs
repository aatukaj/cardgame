use std::{collections::HashSet, sync::Arc};

use crate::user::User;

use super::{Card, CardKind, State};

#[derive(Debug)]
pub struct Player {
    pub cards: Vec<Card>,
    pub tx: tokio::sync::mpsc::Sender<String>,
    pub user: Arc<User>,
}
impl Player {
    pub fn can_play_card(&self, state: &State) -> bool {
        self.cards.iter().any(|c| state.can_play(c))
    }
    pub fn can_play_consecutive_cards(&self, state: &State, card_indeces: &[usize]) -> bool {
        let mut v = card_indeces.to_vec();
        v.sort();
        v.dedup();

        if card_indeces.is_empty()
            || v.len() != card_indeces.len()
            || card_indeces.iter().any(|e| *e >= self.cards.len())
        {
            return false;
        }
        if !state.can_play(&self.cards[card_indeces[0]]) {
            return false;
        }
        let mut it = card_indeces.windows(2);

        while let Some(&[l, r]) = dbg!(it.next()) {
            let l = &self.cards[l];
            if matches!(l.kind, CardKind::Special(_)) || l.kind != self.cards[r].kind {
                return false;
            }
        }
        true
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use tokio::sync::mpsc;

    use crate::{
        game::{Card, Color, State},
        user::User,
    };

    use super::Player;

    fn create_player(cards: Vec<Card>) -> Player {
        let (tx, _) = mpsc::channel(1);
        Player {
            tx,
            cards,
            user: Arc::new(User::new_empty()),
        }
    }
    #[test]
    fn test_consec() {
        let player = create_player(vec![
            Card::number(1, Color::Red, 0),
            Card::number(1, Color::Green, 0),
            Card::number(1, Color::Yellow, 0),
            Card::reverse(Color::Blue, 0),
            Card::number(1, Color::Blue, 0),
        ]);
        let card_indeces = [1, 4, 2, 0];
        let state = State::default();
        assert!(player.can_play_consecutive_cards(&state, &card_indeces));
        assert!(!player.can_play_consecutive_cards(&state, &[3, 1, 2]));
        assert!(!player.can_play_consecutive_cards(&state, &[2, 1, 0, 2]));
    }
}
