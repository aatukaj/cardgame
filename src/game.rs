use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::room::Room;

#[derive(Copy, Clone, Debug, PartialEq, TS, Serialize, Deserialize)]
#[ts(export)]
pub enum Color {
    Red,
    Green,
    Blue,
    Yellow,
    None,
}

#[derive(Copy, Clone, Debug, PartialEq, TS, Serialize, Deserialize)]
#[serde(tag = "tag", content = "fields")]
#[ts(export)]
pub enum NormalCardKind {
    Number(u8),
    Reverse,
    PlusTwo,
    Block,
}

#[derive(Copy, Clone, Debug, PartialEq, TS, Serialize, Deserialize)]
#[ts(export)]
pub enum SpecialCardKind {
    PlusFour,
    ChangeColor,
}

#[derive(Copy, Clone, Debug, PartialEq, TS, Serialize, Deserialize)]
#[ts(export)]
#[serde(tag = "tag", content = "fields")]
pub enum CardKind {
    Normal(NormalCardKind),
    Special(SpecialCardKind),
}

#[derive(TS, Clone, Debug, Serialize, Deserialize)]
#[ts(export)]
pub struct Card {
    pub color: Color,
    pub kind: CardKind,
}
pub struct State {
    pub played_cards: Vec<Card>,
    pub unplayed_cards: Vec<Card>,
    pub turn_direction: TurnDirection,
    skip_next: usize,
    give_next: usize,
    pub turn_index: usize,
}

#[derive(TS,Clone, Copy, Serialize, Debug)]
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

#[derive(Debug)]
pub struct Player {
    pub cards: Vec<Card>,
    pub tx: tokio::sync::mpsc::Sender<String>,
    pub user_name: String,
}

const COLORS: [Color; 4] = [Color::Red, Color::Green, Color::Yellow, Color::Blue];

impl State {
    pub fn next_turn(&mut self, room: &mut Room) {
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
