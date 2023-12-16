import CardView from './CardView.tsx'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '@bindings/Card.ts'
import useWebSocket from 'react-use-websocket';
import ChatBox from './ChatBox.tsx'
import { Response } from '@bindings/Response.ts';
import { Request } from '@bindings/Request.ts';
import { Color } from '@bindings/Color.ts';
import { CardKind } from '@bindings/CardKind.ts';
import RadialColorSelector from './RadialColorSelector.tsx';
import { GameState } from '@bindings/GameState.ts';


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

function App() {
  const [selection, setSelection] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    ownCards: [...Array(20).keys()].map((i) => ({
      kind: [{ tag: "Special", fields: "PlusFour" }, { tag: "Normal", fields: { tag: "PlusTwo" } }][i % 2] as CardKind,
      color: ["None", "Red"][i % 2] as Color
    }
    )), topCard: { color: "Red", kind: { tag: "Normal", fields: { tag: "Number", fields: 5 } } }, turnIndex: 0, selfIndex: 0, users: []
  });

  const { sendJsonMessage, lastJsonMessage } = useWebSocket("ws://127.0.0.1:8080", { share: true });
  useEffect(() => {
    if (lastJsonMessage !== null) {
      const data = lastJsonMessage as Response;
      console.log(data);
      if (data.tag === "GameState") {
        setGameState(data.fields)
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
      <div className='w-screen h-screen p-10 bg-zinc-950 flex flex-row overflow-hidden text-white place-content-between'>
        <div className='flex flex-col place-content-between h-full w-2/3'>
          <div className='flex flex-row place-content-evenly'>
            {gameState.users.filter((_, i) => i != gameState.selfIndex).map((p, i) => <div key={i}><span>{p.userName}</span><br />{p.cardCount} </div>)}
          </div>
          <div className='self-center relative flex z-0'>
            <div onClick={() => { if (!showColorSelector) { playCard() } }} 
            className={`z-10 w-24 h-36 border-2 rounded-lg border-zinc-500 border-dashed flex flex-row justify-center items-center ${selection === null || showColorSelector ? "" : CanPlayCard(gameState.topCard, gameState.ownCards[selection]) ? "cursor-pointer" : "cursor-not-allowed"}`}>
              {gameState.topCard !== null ? <CardView card={gameState.topCard}></CardView> : <></>}
            </div>

 
            {showColorSelector ? <div className='z-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
              <RadialColorSelector onClick={playCard} />
            </div> : <></>}

          </div>
          <div className='overflow-y-auto pt-4 h-2/5 bg-zinc-900 rounded-md'>
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
        <div className='w-1/3 flex-none'>
          <ChatBox />
        </div>
      </div>
    </>
  )
}

export default App
