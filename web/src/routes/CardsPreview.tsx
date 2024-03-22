import { Card } from "@bindings/Card";
import PlayerCarousel from "../components/PlayerCarousel";
import { PlayerInfo } from "@bindings/PlayerInfo";
export default function CardsPreview() {

    const cards: Card[] = []
    for (const color of ["Red", "Green", "Yellow", "Blue", "None"] as const) {
        for (let i = 0; i <= 9; i++) {
            cards.push({
                color, kind: {
                    tag: "Normal",
                    fields: { tag: "Number", "fields": i }
                },
                id: 0

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
                },
                id: 0
            })
        }
        for (const tag of ["PlusFour", "ChangeColor"] as const) {
            cards.push({
                color,
                kind: {
                    tag: "Special",
                    fields: tag
                },
                id: 0
            })
        }
    }
    const playerInfos: PlayerInfo[] = []
    for (let i = 0; i < 6; i++) {
        playerInfos.push({
            cardCount: 12,
            user: {
                id: 0,
                name: `bob${i}`,
                avatar: {
                    tieIndex: 0,
                    tieColorIndex: 0,
                    eyeIndex: 0,
                    eyeColorIndex: 0,
                }
            }
        })

    }
    return (
        <div className="flex flex-row w-full h-full flex-wrap gap-2">
            {//cards.map((c, i) => <CardView card={c} key={i} />)
            }
            <PlayerCarousel playerInfos={playerInfos} selected={1} />

        </div>
    )

}
