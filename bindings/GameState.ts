// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { Card } from "./Card";
import type { PlayerInfo } from "./PlayerInfo";
import type { TurnDirection } from "./TurnDirection";

export type GameState = { users: Array<PlayerInfo>, direction: TurnDirection, ownCards: Array<Card>, turnIndex: number, topCard: Card | null, selfIndex: number, cardsPlayed: number, lastPlayedCards: Array<Card>, };