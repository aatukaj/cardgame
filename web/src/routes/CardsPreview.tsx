import { Card } from "@bindings/Card";
import CardView from "../components/CardView";

import PlayerInfoView from "../components/PlayerInfoView";
import CardPile from "../components/CardPile";
import { useEffect, useState } from "react";

export default function CardsPreview() {
    const [pileOffset, setPileOffset] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
          setPileOffset(i => i + 1)
        }, 1000);
        return () => clearInterval(interval);
      }, []);


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
            <PlayerInfoView playerInfo={{ user: { name: "bob", eyeColorIndex: 0, eyeIndex: 0, tieColorIndex: 0, tieIndex: 0 }, cardCount: 12 }} />
            <PlayerInfoView playerInfo={{ user: { name: "lsob", eyeColorIndex: 0, eyeIndex: 0, tieColorIndex: 0, tieIndex: 0 }, cardCount: 5 }} />
            <CardPile cards={[cards[0], cards[19], cards[50], cards[3]]} offset={pileOffset} />
        </div>
    )

}