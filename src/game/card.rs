use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Copy, Clone, Debug, PartialEq, TS, Serialize, Deserialize)]
#[ts(export)]
pub enum Color {
    Red,
    Green,
    Blue,
    Yellow,
    None,
}

pub const COLORS: [Color; 4] = [Color::Red, Color::Green, Color::Yellow, Color::Blue];

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

#[derive(TS, Clone, Debug, Serialize, Deserialize, PartialEq)]
#[ts(export)]
pub struct Card {
    pub color: Color,
    pub kind: CardKind,
    pub id: u8,
}

#[allow(unused)]
impl Card {
    pub fn number(num: u8, color: Color, id: u8) -> Self {
        Self {
            color,
            kind: CardKind::Normal(NormalCardKind::Number(num)),
            id,
        }
    }
    pub fn reverse(color: Color, id: u8) -> Self {
        Self {
            color,
            kind: CardKind::Normal(NormalCardKind::Reverse),
            id,
        }
    }
    pub fn plus_two(color: Color, id: u8) -> Self {
        Self {
            color,
            kind: CardKind::Normal(NormalCardKind::PlusTwo),
            id,
        }
    }
    pub fn block(color: Color, id: u8) -> Self {
        Self {
            color,
            kind: CardKind::Normal(NormalCardKind::Block),
            id,
        }
    }
    pub fn plus_four(id: u8) -> Self {
        Self {
            color: Color::None,
            kind: CardKind::Special(SpecialCardKind::PlusFour),
            id,
        }
    }
    pub fn change_color(id: u8) -> Self {
        Self {
            color: Color::None,
            kind: CardKind::Special(SpecialCardKind::ChangeColor),
            id,
        }
    }
}
