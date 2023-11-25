import CardView from './CardView.tsx'
import { useState, useEffect } from 'react'
import { Card } from '@bindings/Card.ts'
import useWebSocket from 'react-use-websocket';
import ChatBox from './ChatBox.tsx'
import { Response } from '@bindings/Response.ts';
import { Request } from '@bindings/Request.ts';
import { UserData } from '@bindings/UserData.ts';
import { Color } from '@bindings/Color.ts';



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
  const [selection, setSelection] = useState<number | null>(0);
  const [cards, setCards] = useState<Card[]>([...Array(20).keys()].map((i) => ({
    kind: { tag: "Normal", fields: { tag: "Number", fields: i % 10 } },
    color: ["Red", "Green", "Yellow", "Blue"][i % 4] as Color
  }
  )));

  const [players, setPlayers] = useState<UserData[]>([]);
  const [topCard, setTopCard] = useState<Card | null>({ color: "Red", kind: { tag: "Normal", fields: { tag: "Number", fields: 5 } } });
  //const [topCard, setTopCard] = useState<Card | null>(null);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [selfIndex, setSelfIndex] = useState<number>(0);
  const { sendJsonMessage, lastJsonMessage } = useWebSocket("ws://127.0.0.1:8080", { share: true });
  useEffect(() => {
    if (lastJsonMessage !== null) {
      const data = lastJsonMessage as Response;
      console.log(data);
      if (data.tag === "GameState") {

        setCards(data.fields.own_cards);
        setPlayers(data.fields.users);
        setTopCard(data.fields.top_card);
        setTurnIndex(data.fields.turn_index);
        setSelfIndex(data.fields.self_index);
      }

    }
  }, [lastJsonMessage]);

  return (
    <>
      <div className='w-screen h-screen p-10 bg-zinc-950 flex flex-row overflow-hidden text-white place-content-between'>
        <div className='flex flex-col place-content-between h-full w-2/3'>
          <div className='flex flex-row place-content-evenly'>
            {players.filter((_, i) => i != selfIndex).map((p, i) => <div key={i}><span>{p.user_name}</span><br />{p.card_count} </div>)}
          </div>
          <div className='self-center relative flex z-0'>
            {topCard !== null ? <CardView card={topCard}></CardView> : <></>}
            <div
              onClick={() => {if (turnIndex===selfIndex && selection!==null && CanPlayCard(topCard, cards[selection])) {
                setTopCard(cards[selection]);
                sendJsonMessage<Request>({tag: "PlayCard", fields: selection})
                setCards(c => c.filter((_, i) => i !== selection));
                setSelection(null);
              }}}
              className='z-10 w-24 h-36 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 rounded-lg border-zinc-500 border-dashed'>

            </div>
          </div>
          <div className='overflow-y-auto pt-4 h-2/5 bg-zinc-900 rounded-md'>
            <div className='flex flex-row flex-wrap justify-center gap-2'>
              {
                cards.map((card, n) =>
                  <div key={n} className="cursor-pointer hover:z-50 hover: delay-100" onClick={() => setSelection(n)} >
                    <CardView card={card} selected={n === selection} />
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
