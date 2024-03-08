import { twJoin } from "tailwind-merge";
import { AVATAR_COLORS } from "../assets/avatar";
import UICard from "./UICard";

export default function ColorPalette({title, onClick}: {title: string, onClick: (index: number) => void}) {
    return (
        <UICard>
            <UICard.Header>
                {title}
            </UICard.Header>
            <UICard.Body>
                <div className="grid grid-cols-2">
                    {AVATAR_COLORS.map(({ bg }, i) => <div key={i} onClick={(e) => {e.preventDefault(); onClick(i)}}className={twJoin(bg, "size-6")}></div>)}
                </div>
            </UICard.Body>
        </UICard>
    )
}