#[derive(Copy, Clone, Debug, PartialEq, TS, Serialize, Deserialize)]
#[ts(export)]
pub enum Color {
    Red,
    Green,
    Blue,
    Yellow,
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

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::room::{self, Room};

#[derive(TS, Clone, Debug, Serialize, Deserialize)]
#[ts(export)]
pub struct Card {
    pub color: Color,
    pub kind: CardKind,
}
pub struct State {
    pub played_cards: Vec<Card>,
    pub unplayed_cards: Vec<Card>,
    turn_direction: TurnDirection,
    skip_next: bool,
    pub turn_index: usize,
}
enum TurnDirection {
    Clockwise,
    CounterClockwise,
}

#[derive(Debug)]
pub struct Player {
    pub cards: Vec<Card>,
    pub tx: tokio::sync::mpsc::Sender<String>,
    pub user_name: String,
}

const COLORS: [Color; 4] = [Color::Red, Color::Green, Color::Yellow, Color::Blue];

impl State {
    //This is an abomination
    pub fn next_turn(&mut self, room: &Room) {
        if self.skip_next {
            self.skip_next = false;
            self.next_turn(room);
        }
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
    pub fn play_card(&mut self, room: &mut Room, card: Card) {
        match card.kind {
            CardKind::Normal(k) => match k {
                NormalCardKind::Block => self.skip_next = true,
                _ => (),
            },
            _ => (),
        }
    }

    pub fn can_play(&self, card: &Card) -> bool {
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
                    color,
                    kind: CardKind::Special(SpecialCardKind::PlusFour),
                });
                unplayed_cards.push(Card {
                    color,
                    kind: CardKind::Special(SpecialCardKind::ChangeColor),
                });
            }
        }
        Self {
            played_cards: Default::default(),
            unplayed_cards,
            turn_direction: TurnDirection::Clockwise,
            skip_next: false,
            turn_index: 0,
        }
    }
}
