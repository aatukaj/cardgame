import CardView, { UnplayedCardView } from '../components/CardView.tsx'
import { useState, } from 'react'
import ChatBox from '../components/ChatBox.tsx'
import RadialColorSelector from '../components/RadialColorSelector.tsx';
import { useParams } from 'react-router-dom';
import CardPile from '../components/CardPile.tsx';
import useGame, { canPlayPlannedPlay, plannedPlayToArr } from '../useGame.ts';
import Button from '../components/Button.tsx';
import { twJoin } from 'tailwind-merge';
import PlayerCarousel from '../components/PlayerCarousel.tsx';


export default function Game() {
  const [selection, setSelection] = useState<number | null>(null);
  const { lobbyId } = useParams();
  const { dispatch, sendChatMessage, playCards, takeCard, state } = useGame(lobbyId!);
  const cardPileEnabled = selection !== null && canPlayPlannedPlay(state, selection);

  const showColorSelector = state.ownCards[selection!]?.kind.tag === "Special" && cardPileEnabled;
  const plannedPlayCards = plannedPlayToArr(state.plannedPlay, state)
  return (

    <> <div className='w-full h-full flex flex-row place-content-between gap-4'>
      <div className='flex flex-col place-content-between h-full w-2/3 items-center'>

        <PlayerCarousel playerInfos={state.users.map((p, i) =>
          i == state.selfIndex ?
            { ...p, user: { ...p.user, name: `You (${p.user.name})`, } }
            : p
        )} selected={state.turnIndex} />
        <div className='relative flex z-0 grid grid-cols-2 gap-2'>
          <div
            className="z-10 p-2 border-zinc-500 border-dashed rounded-lg border-2 grid grid-cols-subgrid col-span-2">
            <UnplayedCardView onClick={takeCard} />
            <CardPile cards={
              state.lastPlayedCards.concat(plannedPlayCards
              )
            }
              offset={state.cardsPlayed + plannedPlayCards.length}
              enabled={cardPileEnabled}
              onClick={() => { if (selection !== null) { dispatch({ type: "add_card", card: selection }); setSelection(null) } }} />
          </div>

          <Button onClick={() => dispatch({ type: "clear_play" })} variant='red' className='w-16 justify-self-end'>Revert </Button>

          <Button onClick={playCards} variant='green' className='w-16 justify-self-start'>Play </Button>

          {showColorSelector && <div className='z-20 absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-3/4'>
            <RadialColorSelector onClick={(c) => {
              if (selection !== null) {
                dispatch({ type: "play_special_card", card: selection, color: c });
                setSelection(null)
              }
            }} />
          </div>}

        </div>
        <div className='overflow-y-auto pt-4 px-2 h-2/5 bg-zinc-900 border border-zinc-700 w-full'>
          <div className='flex flex-row flex-wrap justify-center gap-2'>
            {
              state.ownCards.map((card, n) => {
                let isToPlay = plannedPlayCards.some((c) => c.id == card.id);
                return (
                  <div
                    key={card.id}
                    className={twJoin(isToPlay ? "opacity-50" : "cursor-pointer")}
                    onClick={() => { if (!isToPlay) setSelection(n) }}
                  >
                    <CardView card={card} selected={n === selection} hover={!isToPlay} />
                  </div>
                )
              }
              )
            }
          </div>
        </div>

      </div>

      <ChatBox messages={state.messages} onMessage={sendChatMessage} />

    </div>
    </>
  )
}

