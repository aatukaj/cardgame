use std::mem;

use rand::seq::SliceRandom;
use serde::{Serialize};
use ts_rs::TS;

use crate::room::RoomActor;
mod player;
pub use player::*;
mod card;
pub use card::*;


pub struct State {
    pub played_cards: Vec<Card>,
    pub unplayed_cards: Vec<Card>,
    pub turn_direction: TurnDirection,
    skip_next: usize,
    give_next: usize,
    pub turn_index: usize,
}

#[derive(TS, Clone, Copy, Serialize, Debug)]
#[ts(export)]
pub enum TurnDirection {
    Clockwise,
    CounterClockwise,
}
impl TurnDirection {
    fn flip(&self) -> Self {
        match self {
            TurnDirection::Clockwise => TurnDirection::CounterClockwise,
            TurnDirection::CounterClockwise => TurnDirection::Clockwise,
        }
    }
}

impl State {
    /// Pops the top card from `unplayed_cards`
    /// if `unplayed_cards` is empty, shuffles the played cards back into it
    pub fn draw_card(&mut self) -> Card {
        match self.unplayed_cards.pop() {
            Some(card) => card,
            None => {
                let top = self.played_cards.pop().unwrap();
                mem::swap(&mut self.unplayed_cards, &mut self.played_cards);
                self.unplayed_cards.shuffle(&mut rand::thread_rng());
                self.played_cards = vec![top];
                self.unplayed_cards.pop().unwrap()
            }
        }
    }

    pub fn next_turn(&mut self, room: &mut RoomActor) {
        for _ in 0..=self.skip_next {
            match self.turn_direction {
                TurnDirection::Clockwise => {
                    if self.turn_index == 0 {
                        self.turn_index = room.players.len();
                    };
                    self.turn_index -= 1
                }
                TurnDirection::CounterClockwise => {
                    self.turn_index += 1;
                    if self.turn_index >= room.players.len() {
                        self.turn_index = 0;
                    }
                }
            }
        }
        if self.give_next > 0 {
            let Some((_, player)) = room.players.get_index_mut(self.turn_index) else {
                return;
            };
            player.cards.extend(
                self.unplayed_cards
                    .drain(self.unplayed_cards.len() - self.give_next..),
            )
        }
        self.skip_next = 0;
        self.give_next = 0;
    }
    pub fn place_card(&mut self, card: Card) {
        match card.kind {
            CardKind::Normal(k) => match k {
                NormalCardKind::Block => self.skip_next += 1,
                NormalCardKind::Reverse => self.turn_direction = self.turn_direction.flip(),
                NormalCardKind::PlusTwo => self.give_next += 2,
                NormalCardKind::Number(_) => {}
            },
            CardKind::Special(k) => match k {
                SpecialCardKind::PlusFour => self.give_next += 4,
                SpecialCardKind::ChangeColor => {}
            },
        }
        self.played_cards.push(card)
    }

    pub fn can_play(&self, card: &Card) -> bool {
        if card.color == Color::None {
            return false;
        }
        let Some(top) = self.played_cards.last() else {
            return true;
        };
        match card.kind {
            CardKind::Special(_) => true,
            CardKind::Normal(k) => {
                if card.color == top.color {
                    true
                } else {
                    match (k, top.kind) {
                        (_, CardKind::Special(_)) => false,
                        (
                            NormalCardKind::Number(a),
                            CardKind::Normal(NormalCardKind::Number(b)),
                        ) => a == b,
                        (k, CardKind::Normal(t)) => k == t,
                    }
                }
            }
        }
    }
}

impl Default for State {
    fn default() -> Self {
        let mut unplayed_cards: Vec<Card> = Vec::new();
        for color in COLORS {
            unplayed_cards.push(Card {
                color,
                kind: CardKind::Normal(NormalCardKind::Number(0)),
            });
            for _ in 0..2 {
                for i in 1..=9 {
                    unplayed_cards.push(Card {
                        color,
                        kind: CardKind::Normal(NormalCardKind::Number(i)),
                    })
                }
                unplayed_cards.push(Card {
                    color,
                    kind: CardKind::Normal(NormalCardKind::Block),
                });
                unplayed_cards.push(Card {
                    color,
                    kind: CardKind::Normal(NormalCardKind::Reverse),
                });
                unplayed_cards.push(Card {
                    color,
                    kind: CardKind::Normal(NormalCardKind::PlusTwo),
                });
                unplayed_cards.push(Card {
                    color: Color::None,
                    kind: CardKind::Special(SpecialCardKind::PlusFour),
                });
                unplayed_cards.push(Card {
                    color: Color::None,
                    kind: CardKind::Special(SpecialCardKind::ChangeColor),
                });
            }
        }
        Self {
            played_cards: Default::default(),
            unplayed_cards,
            turn_direction: TurnDirection::Clockwise,
            skip_next: 0,
            turn_index: 0,
            give_next: 0,
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_draw_card_unplayed_empty() {
        let mut state = State {
            played_cards: vec![Card::block(Color::Red), Card::block(Color::Blue), Card::block(Color::Yellow)],
            unplayed_cards: vec![],
            ..Default::default()
        };
        let drawn = state.draw_card();
        assert_eq!(state.played_cards, vec![Card::block(Color::Yellow)]);
        assert!(state.unplayed_cards.len() == 1);
        assert!(matches!(drawn.color,  Color::Red | Color::Blue))
    }

    #[test]
    fn test_draw_card_unplayed_non_empty() {
        let mut state = State {
            played_cards: vec![Card::block(Color::Red), Card::block(Color::Blue), Card::block(Color::Yellow)],
            unplayed_cards: vec![Card::block(Color::Green)],
            ..Default::default()
        };
        let drawn = state.draw_card();
        assert_eq!(state.played_cards, vec![Card::block(Color::Red), Card::block(Color::Blue), Card::block(Color::Yellow)]);
        assert!(state.unplayed_cards.is_empty());
        assert_eq!(drawn, Card::block(Color::Green))
    }
}