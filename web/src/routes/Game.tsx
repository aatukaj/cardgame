import CardView from '../components/CardView.tsx'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '@bindings/Card.ts'
import useWebSocket from 'react-use-websocket';
import ChatBox from '../components/ChatBox.tsx'
import { Response } from '@bindings/Response.ts';
import { Request } from '@bindings/Request.ts';
import { Color } from '@bindings/Color.ts';
import RadialColorSelector from '../components/RadialColorSelector.tsx';
import { GameState } from '@bindings/GameState.ts';
import { ChatMessage } from '@bindings/ChatMessage.ts';
import { useParams } from 'react-router-dom';


function CanPlayCard(topCard: Card | null, toPlay: Card): boolean {
  if (topCard === null || toPlay.kind.tag === "Special" || topCard.color === toPlay.color) {
    return true;
  }
  if (topCard.kind.tag !== "Special") {
    if (toPlay.kind.fields.tag !== "Number") return topCard.kind.fields.tag === toPlay.kind.fields.tag;
    else return topCard.kind.fields.tag === "Number" && topCard.kind.fields.fields === toPlay.kind.fields.fields;

  }
  return false
}

export default function Game() {
  const [selection, setSelection] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    ownCards: [], topCard: null, turnIndex: 0, selfIndex: 0, users: [], direction: "Clockwise"
  });
  const { lobbyId } = useParams();
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(`ws://127.0.0.1:8080/join/${lobbyId}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if (lastJsonMessage !== null) {
      const data = lastJsonMessage as Response;
      console.log(data);
      if (data.tag === "GameState") {
        setGameState(data.fields)
      } else if (data.tag === "ChatMessage") {
        setMessages(m => m.concat(data.fields))
      }

    }
  }, [lastJsonMessage]);
  const playCard = useCallback((color?: Color) => {
    if (selection === null) { return; }
    const selectedCard = gameState.ownCards[selection];
    if (gameState.turnIndex === gameState.selfIndex && CanPlayCard(gameState.topCard, selectedCard)) {
      if (color) {
        selectedCard.color = color
      }
      setGameState({
        ...gameState,
        topCard: selectedCard,
        ownCards: gameState.ownCards.filter((_, i) => i !== selection),

      })

      sendJsonMessage<Request>({ tag: "PlayCard", fields: [selection, color || "None"] })
      setSelection(null);
    }
  }, [selection, sendJsonMessage, gameState])

  const showColorSelector = gameState.ownCards[selection!]?.kind.tag === "Special";

  return (
    <>
      <div className='w-full h-full flex flex-row place-content-between gap-4'>
        <div className='flex flex-col place-content-between h-full w-2/3'>
          <div className='flex flex-row place-content-evenly'>
            {gameState.users.filter((_, i) => i != gameState.selfIndex).map((p, i) => <div key={i}><span>{p.userName}</span><br />{p.cardCount} </div>)}
          </div>
          <div className='self-center relative flex z-0'>
            <div onClick={() => { if (!showColorSelector) { playCard() } }}
              className={`z-10 w-24 h-36 border-zinc-500 border-dashed rounded-lg border-2 flex flex-row justify-center items-center ${selection === null || showColorSelector ? "" : CanPlayCard(gameState.topCard, gameState.ownCards[selection]) ? "cursor-pointer" : "cursor-not-allowed"}`}>
              {gameState.topCard !== null ? <CardView card={gameState.topCard}></CardView> : <></>}
            </div>


            {showColorSelector ? <div className='z-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
              <RadialColorSelector onClick={playCard} />
            </div> : <></>}

          </div>
          <div className='overflow-y-auto pt-4 px-2 h-2/5 bg-zinc-900 border border-zinc-700'>
            <div className='flex flex-row flex-wrap justify-center gap-2'>
              {
                gameState.ownCards.map((card, n) =>
                  <div key={n} className="cursor-pointer" onClick={() => { setSelection(n) }} >
                    <CardView card={card} selected={n === selection} hover={true} />
                  </div>
                )
              }
            </div>
          </div>

        </div>

        <ChatBox messages={messages} onMessage={(msg) => sendJsonMessage({ tag: "SendMessage", fields: { content: msg } })} />

      </div>
    </>
  )
}

