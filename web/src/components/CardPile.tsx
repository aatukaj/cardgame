import { Card } from "@bindings/Card";
import CardView from "./CardView";
import { twJoin } from "tailwind-merge";

const TRANSFORMS = ["-rotate-6", "rotate-12", "", "-rotate-[15deg]", "-rotate-3"]
const OPACITIES = ["brightness-100", "brightness-75", "brightness-50", "brightness-[25%]"]

// 0 index is the top card
export default function CardPile({ cards, offset }: { cards: Card[], offset: number }) {
    return (
        <div className="grid grid-cols-1 grid-rows-1">
            {cards.map((c, i) => <div key={offset - i} className={twJoin("row-start-1 col-start-1", TRANSFORMS[(offset - i) % TRANSFORMS.length], OPACITIES[i])}>
                <CardView card={c} />
            </div>).reverse()}
        </div>
    )
}
