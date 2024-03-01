import { Card } from '@bindings/Card'
import type { NormalCardKind } from '@bindings/NormalCardKind';
import type { SpecialCardKind } from '@bindings/SpecialCardKind';
import { COLOR_TO_BG } from '../util';

import { NoSymbolIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import { twJoin } from 'tailwind-merge';


function NormalCardInner({ kind }: { kind: NormalCardKind }) {
    switch (kind.tag) {
        case "Reverse": return <ArrowPathIcon className='w-14 h-14 stroke-2' />
        case "Block": return <NoSymbolIcon className='w-14 h-14 stroke-2' />

        case "PlusTwo": return <span>+2</span>
        case "Number": return <span>{kind.fields}</span>
    }
}
function SpecialCardInner({ kind }: { kind: SpecialCardKind }) {
    switch (kind) {
        case "ChangeColor": return <></>
        case "PlusFour": return <span>+4</span>
    }
}

function CardView({ card, selected = false, hover = false }: { card: Card, selected?: boolean, hover?: boolean }) {
    const color = COLOR_TO_BG[card.color];
    const cname = twJoin(
        card.kind.tag === "Normal" ? color : "bg-black", 
        selected && "shadow-md shadow-white", 
        hover && "hover:-translate-y-2", 
        "w-20 h-32 relative rounded-md border-white-0 border-4 text-center flex flex-col justify-center text-white font-bold text-4xl items-center transition-all select-none")
    return (
        <div className={cname}>
            {card.kind.tag === "Normal" ?
                <NormalCardInner kind={card.kind.fields} /> :
                <>
                    <div className={`${color} absolute w-full h-2/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 skew-y-6`}></div>
                    <div className='z-10' >
                        <SpecialCardInner kind={card.kind.fields} />
                    </div>
                </>}
        </div>
    )
}
export default CardView



