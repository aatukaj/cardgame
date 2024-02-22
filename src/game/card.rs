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
}

#[allow(unused)]
impl Card {
    pub fn number(num: u8, color: Color) -> Self {
        Self { color, kind: CardKind::Normal(NormalCardKind::Number(num)) }
    }
    pub fn reverse(color: Color) -> Self {
        Self { color, kind: CardKind::Normal(NormalCardKind::Reverse) }
    }
    pub fn plus_two(color: Color) -> Self {
        Self { color, kind: CardKind::Normal(NormalCardKind::PlusTwo) }
    }
    pub fn block(color: Color) -> Self {
        Self { color, kind: CardKind::Normal(NormalCardKind::Block) }
    }
    pub fn plus_four() -> Self {
        Self { color: Color::None, kind: CardKind::Special(SpecialCardKind::PlusFour) }
    }
    pub fn change_color() -> Self {
        Self { color: Color::None, kind: CardKind::Special(SpecialCardKind::ChangeColor) }
    }
}