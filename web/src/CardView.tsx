import { Card } from '@bindings/Card'
import type { NormalCardKind } from '@bindings/NormalCardKind';
import type { SpecialCardKind } from '@bindings/SpecialCardKind';
import { COLOR_TO_BG } from './util';



function NormalCardInner({ kind }: { kind: NormalCardKind }) {
    switch (kind.tag) {
        case "Reverse": return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.0} stroke="currentColor" className="w-2/3 h-2/3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
        case "Block": return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.0} stroke="currentColor" className="w-2/3 h-2/3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>

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

function CardView({ card, selected=false, hover=false }: { card: Card, selected?: boolean, hover?: boolean}) {
    const color = COLOR_TO_BG[card.color];
    return (

        <div className={`${card.kind.tag === "Normal" ? color : "bg-black"} ${selected ? "shadow-lg shadow-white" : ""} ${hover ? "hover:-translate-y-2": ""} w-20 h-32 relative rounded-md border-white-0 border-4 text-center flex flex-col justify-center text-white font-bold text-4xl items-center transition-all select-none`}>
            {card.kind.tag === "Normal" ?
                <NormalCardInner kind={card.kind.fields} /> :
                <>
                    <div className={`${color} absolute w-2/3 h-2/3 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}></div>
                    <div className='z-10' >
                        <SpecialCardInner kind={card.kind.fields} />
                    </div>
                </>}
        </div>
    )
}
export default CardView



