import CardView, { UnplayedCardView } from '../components/CardView.tsx'
import { useState, } from 'react'
import ChatBox from '../components/ChatBox.tsx'
import RadialColorSelector from '../components/RadialColorSelector.tsx';
import { useParams } from 'react-router-dom';
import PlayerInfoView from '../components/PlayerInfoView.tsx';
import CardPile from '../components/CardPile.tsx';
import useGame from '../useGame.ts';
import Button from '../components/Button.tsx';
import { twJoin } from 'tailwind-merge';


export default function Game() {
  const [selection, setSelection] = useState<number | null>(null);
  const { lobbyId } = useParams();
  const { gameState, sendChatMessage, lastPlayedCards, playCards, takeCard, chatMessages, cardsToPlay, addCardToPlay, clearCardsToPlay } = useGame(lobbyId!);
  const showColorSelector = gameState.ownCards[selection!]?.kind.tag === "Special";
  const ownTurn = gameState.turnIndex == gameState.selfIndex;
  const cardPileEnabled = true;
  return (
    <>
      <div className='w-full h-full flex flex-row place-content-between gap-4'>
        <div className='flex flex-col place-content-between h-full w-2/3'>
          <div className='flex flex-row place-content-evenly'>
            {gameState.users.filter((_, i) => i != gameState.selfIndex).map((p, i) => <PlayerInfoView playerInfo={p} key={i} />)}
          </div>
          <div className='self-center relative flex z-0 grid grid-cols-2 gap-2'>
            <div
              className="z-10 p-2 border-zinc-500 border-dashed rounded-lg border-2 grid grid-cols-subgrid col-span-2">
              <UnplayedCardView onClick={takeCard} />
              <CardPile cards={cardsToPlay.reverse().map((n) => gameState.ownCards[n]).concat(...lastPlayedCards)}
                offset={gameState.cardsPlayed + cardsToPlay.length}
                enabled={cardPileEnabled}
                onClick={() => { if (selection !== null) { if (addCardToPlay(selection)) setSelection(null) } }} />
            </div>

            <Button onClick={clearCardsToPlay} variant='red' className='w-16 justify-self-end'>Revert </Button>

            <Button onClick={playCards} variant='green' className='w-16 justify-self-start'>Play </Button>

            {showColorSelector && <div className='z-20 absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2'>
              <RadialColorSelector onClick={(_c) => { if (selection !== null) { if (addCardToPlay(selection)) setSelection(null) } }} />
            </div>}

          </div>
          <div className='overflow-y-auto pt-4 px-2 h-2/5 bg-zinc-900 border border-zinc-700'>
            <div className='flex flex-row flex-wrap justify-center gap-2'>
              {
                gameState.ownCards.map((card, n) => {
                  let isToPlay = cardsToPlay.some((e) => e == n);
                  return (<div key={n} className={twJoin("cursor-pointer", isToPlay && "opacity-50")} onClick={() => { if (!isToPlay) setSelection(n) }} >
                    <CardView card={card} selected={n === selection} hover={!isToPlay} />
                  </div>)
                }
                )
              }
            </div>
          </div>

        </div>

        <ChatBox messages={chatMessages} onMessage={sendChatMessage} />

      </div>
    </>
  )
}

