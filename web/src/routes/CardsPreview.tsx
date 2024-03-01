import { Card } from "@bindings/Card";
import CardView from "../components/CardView";

import PlayerInfoView from "../components/PlayerInfoView";

export default function CardsPreview() {
    const cards: Card[] = []
    for (const color of ["Red", "Green", "Yellow", "Blue", "None"] as const) {
        for (let i = 0; i <= 9; i++) {
            cards.push({
                color, kind: {
                    tag: "Normal",
                    fields: { tag: "Number", "fields": i }
                }
            })
        }
        for (const tag of ["Reverse", "Block", "PlusTwo"] as const) {
            cards.push({
                color,
                kind: {
                    tag: "Normal",
                    fields: {
                        tag,
                    }
                }
            })
        }
        for (const tag of ["PlusFour", "ChangeColor"] as const) {
            cards.push({
                color,
                kind: {
                    tag: "Special",
                    fields: tag
                }
            })
        }
    }
    return (
        <div className="flex flex-row w-full h-full flex-wrap gap-2">
            {cards.map((c, i) => <CardView card={c} key={i} />)}
            <PlayerInfoView playerInfo={{ userName: "bob", cardCount: 12 }} />
            <PlayerInfoView playerInfo={{ userName: "boberto", cardCount: 5 }} />
            <div className="relative">
                <div className="absolute brightness-75">
                    <CardView card={cards[0]} />
                </div>
                <div className="absolute rotate-12 brightness-90">
                    <CardView card={cards[15]} />
                </div>
                <div className="absolute -rotate-6">
                    <CardView card={cards[37]} />
                </div>

            </div>
        </div>
    )

}