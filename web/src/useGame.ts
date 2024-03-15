import { Card } from "@bindings/Card"
import { ChatMessage } from "@bindings/ChatMessage"
import { GameState } from "@bindings/GameState"
import { Response } from "@bindings/Response"
import { Request } from "@bindings/Request";
import { useCallback, useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { last } from "./util";

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


type GameHook = {
    gameState: GameState,
    lastPlayedCards: Card[],
    playCards: () => void,
    takeCard: () => void,
    chatMessages: ChatMessage[],
    sendChatMessage: (content: string) => void,
    addCardToPlay: (cardIndex: number) => boolean,
    clearCardsToPlay: () => void,
    cardsToPlay: number[],
}

export default function useGame(lobbyId: string): GameHook {
    const [gameState, setGameState] = useState<GameState>({
        ownCards: [], topCard: null, turnIndex: 0, selfIndex: 0, users: [], direction: "Clockwise", cardsPlayed: 0
    });

    const { sendJsonMessage, lastJsonMessage } = useWebSocket(`ws://${window.location.host}/ws/${lobbyId}`, { onClose: (event) => { console.log(event) } });
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [lastPlayedCards, setLastPlayedCards] = useState<Card[]>([]);
    const [cardsToPlay, setCardsToPlay] = useState<number[]>([]);
    const [isPlaySpecial, setPlaySpecial] = useState(false);
    useEffect(() => {
        setPlaySpecial(cardsToPlay.length > 0 && gameState.ownCards[cardsToPlay[0]].kind.tag === "Special")
    }, [cardsToPlay, gameState])
    useEffect(() => {
        if (lastJsonMessage !== null) {
            const data = lastJsonMessage as Response;
            console.log(data);
            if (data.tag === "GameState") {
                const newGameState = data.fields;

                if (gameState.cardsPlayed !== newGameState.cardsPlayed && newGameState.topCard !== null) {
                    setLastPlayedCards(c => { return [newGameState.topCard!, ...c]; })
                }
                setGameState(newGameState)
            } else if (data.tag === "ChatMessage") {
                setMessages(m => m.concat(data.fields))
            }

        }
    }, [lastJsonMessage, gameState.cardsPlayed]);
    function addCardToPlay(cardIndex: number): boolean {
        if (isPlaySpecial || cardsToPlay.includes(cardIndex)) return false;
        let topCard = gameState.ownCards[last(cardsToPlay)]
        let toPlay = gameState.ownCards[cardIndex]
        if (cardsToPlay.length <= 0 || canPlayConsecutiveCard(topCard, toPlay)) {
            setCardsToPlay(c => c.concat(cardIndex));
            return true
        }
        return false
    }

    function playCards() {
        if (isPlaySpecial) {
            sendJsonMessage<Request>({ tag: "PlaySpecialCard", fields: [cardsToPlay[0], gameState.ownCards[cardsToPlay[0]].color] })
        } else {
            sendJsonMessage<Request>({ tag: "PlayCards", fields: cardsToPlay })
        }
        clearCardsToPlay();
    }

    function clearCardsToPlay() {
        setCardsToPlay([])
    }
    const sendChatMessage = useCallback((content: string) => {
        sendJsonMessage<Request>({ tag: "SendMessage", fields: { content } })
    }, [sendJsonMessage])

    const takeCard = useCallback(() => {
        sendJsonMessage<Request>({ tag: "TakeCard" })
    }, [sendJsonMessage])

    return {
        gameState, chatMessages: messages, takeCard, playCards, lastPlayedCards, sendChatMessage, addCardToPlay,
        clearCardsToPlay, cardsToPlay,
    }
}
