import { Card } from "@bindings/Card";
import CardView from "./CardView";
import { twJoin } from "tailwind-merge";

const TRANSFORMS = ["-rotate-6", "", "rotate-12", "-rotate-[15deg]", "-rotate-3"]
const BRIGHTNESS_VALUES = ["brightness-100", "brightness-75", "brightness-50", "brightness-[25%]"]

// 0 index is the top card
export default function CardPile({ cards, offset, onClick, enabled }: { cards: Card[], offset: number, onClick: () => void, enabled: boolean }) {
    return (
        <div onClick={() => { if (enabled) { onClick() } }}
            className={twJoin(
                "grid grid-cols-1 grid-rows-1",
                enabled ? "cursor-pointer" : "cursor-not-allowed"
            )}>
            {cards.map((c, i) => <div key={offset - i} className={twJoin("row-start-1 col-start-1", TRANSFORMS[(offset - i) % TRANSFORMS.length], BRIGHTNESS_VALUES[i])}>
                <CardView card={c} />
            </div>).reverse()}
        </div>
    )
}
