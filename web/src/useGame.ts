import { Card } from "@bindings/Card"
import { ChatMessage } from "@bindings/ChatMessage"
import { GameState } from "@bindings/GameState"
import { Response } from "@bindings/Response"
import { Request } from "@bindings/Request";
import { useCallback, useEffect, useReducer } from "react";
import useWebSocket from "react-use-websocket";
import { last } from "./util";
import { Color } from "@bindings/Color";

export function plannedPlayToArr(play: PlannedPlay | null, state: State): Card[] {
    switch (play?.tag) {
        case "Multiple": return play.cards.map((c) => state.ownCards[c])
        case "Special": return [{ ...state.ownCards[play.card], color: play.color }]
    }
    return []
}
export function canPlayCard(topCard: Card | null, toPlay: Card): boolean {
    if (topCard === null || toPlay.kind.tag === "Special" || topCard.color === toPlay.color) {
        return true;
    }
    if (topCard.kind.tag !== "Special") {
        if (toPlay.kind.fields.tag !== "Number") return topCard.kind.fields.tag === toPlay.kind.fields.tag;
        else return topCard.kind.fields.tag === "Number" && topCard.kind.fields.fields === toPlay.kind.fields.fields;

    }
    return false
}

export function canPlayConsecutiveCard(topCard: Card | null, toPlay: Card): boolean {
    if (topCard === null) return true;
    if (toPlay.kind.tag === "Special" || topCard.kind.tag === "Special") return false;
    let topKind = topCard.kind.fields;
    let playKind = toPlay.kind.fields;
    if (topKind.tag === "Number" && playKind.tag === "Number") return topKind.fields === playKind.fields;
    return topKind.tag === playKind.tag;
}


export type PlannedPlay = { tag: "Special", card: number, color: Color } | { tag: "Multiple", cards: number[] }
export type State = {
    plannedPlay: PlannedPlay | null,
    messages: ChatMessage[],

} & GameState

type Action = {
    type: "clear_play"
} | {
    type: "add_card",
    card: number,
} | {
    type: "new_game_state",
    state: GameState
} | {
    type: "new_message",
    message: ChatMessage,
} | {
    type: "play_special_card",
    card: number,
    color: Color,
} | {
    type: "confirm_play"
}

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "confirm_play": {
            const plannedPlayArr = plannedPlayToArr(state.plannedPlay, state);
            return {
                ...state,
                cardsPlayed: state.cardsPlayed + 1,
                ownCards: state.ownCards.filter((c) => !plannedPlayArr.some((p) => p.id == c.id)),
                lastPlayedCards: state.lastPlayedCards.concat(plannedPlayToArr(state.plannedPlay, state)),
                plannedPlay: null,
            }
        }
        case "clear_play": return {
            ...state,
            plannedPlay: null,
        };
        case "add_card": {
            if (state.plannedPlay?.tag === "Special") return state;
            let toPlay = state.ownCards[action.card]
            if (state.plannedPlay?.cards.includes(action.card)) return state;
            if (state.plannedPlay === null && canPlayCard(state.topCard, toPlay)) {
                return {
                    ...state,
                    plannedPlay: {
                        tag: "Multiple",
                        cards: [action.card]
                    }
                }
            }
            if (state.plannedPlay === null) return state
            let topCard = state.ownCards[last(state.plannedPlay.cards)]
            if (topCard.kind.tag !== "Special" && canPlayConsecutiveCard(topCard, toPlay)) {
                return {
                    ...state,
                    plannedPlay: {
                        tag: "Multiple",
                        cards: state.plannedPlay.cards.concat(action.card)
                    }
                }
            }
            return state
        }
        case "new_game_state": return {
            ...state,
            ...action.state,
        }
        case "new_message": return {
            ...state,
            messages: state.messages.concat(action.message)
        }
        case "play_special_card": {
            if (state.plannedPlay === null) {
                return {
                    ...state,
                    plannedPlay: { tag: "Special", ...action }
                }
            }
            return state
        }
    }
}

export default function useGame(lobbyId: string) {
    const [state, dispatch] = useReducer(reducer, {
        plannedPlay: null,
        messages: [],
        ownCards: [], topCard: null, turnIndex: 0, selfIndex: 0, users: [], direction: "Clockwise", cardsPlayed: 0, lastPlayedCards: []
    })
    const { sendJsonMessage, lastJsonMessage } = useWebSocket(`ws://${window.location.host}/ws/${lobbyId}`, { onClose: (event) => { console.log(event) } });

    useEffect(() => {
        if (lastJsonMessage !== null) {
            const data = lastJsonMessage as Response;
            console.log(data);
            if (data.tag === "GameState") {
                dispatch({ type: "new_game_state", state: data.fields })
            } else if (data.tag === "ChatMessage") {
                dispatch({ type: "new_message", message: data.fields })
            }
        }

    }, [lastJsonMessage]);

    function playCards() {
        switch (state.plannedPlay?.tag) {
            case "Multiple": { sendJsonMessage<Request>({ tag: "PlayCards", fields: state.plannedPlay.cards }); break }
            case "Special": { sendJsonMessage<Request>({ tag: "PlaySpecialCard", fields: [state.plannedPlay.card, state.plannedPlay.color] }); break }
        }
        dispatch({ type: "confirm_play" })
    }


    const sendChatMessage = useCallback((content: string) => {
        sendJsonMessage<Request>({ tag: "SendMessage", fields: { content } })
    }, [sendJsonMessage])

    const takeCard = useCallback(() => {
        sendJsonMessage<Request>({ tag: "TakeCard" })
    }, [sendJsonMessage])

    return { state, dispatch, playCards, takeCard, sendChatMessage }
}


