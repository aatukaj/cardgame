import { Card } from "@bindings/Card";
import CardView from "./CardView";
import { twJoin } from "tailwind-merge";

const TRANSFORMS = ["-rotate-6", "", "rotate-12", "-rotate-[15deg]", "-rotate-3"]
const BRIGHTNESS_VALUES = ["brightness-[25%]", "brightness-50", "brightness-75", "brightness-100"]
const MAX_CARDS = 4;
export default function CardPile({ cards, offset, onClick, enabled = true }: { cards: Card[], offset: number, onClick?: () => void, enabled?: boolean }) {
    const length_dif = Math.max(MAX_CARDS - cards.length, 0);
    return (
        <div onClick={() => { if (enabled && onClick) { onClick() } }}
            className={twJoin(
                "grid grid-cols-1 grid-rows-1",
                enabled ? "cursor-pointer" : "cursor-not-allowed"
            )}>
            {cards.slice(Math.max(cards.length - MAX_CARDS, 0)).map((c, i) =>
                <div
                    key={offset + i + length_dif}
                    className={twJoin("row-start-1 col-start-1", TRANSFORMS[(offset + i + length_dif) % TRANSFORMS.length], BRIGHTNESS_VALUES[length_dif + i])}
                >
                    <CardView card={c} />
                </div>)}
        </div>
    )
}
