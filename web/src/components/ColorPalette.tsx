import { twJoin } from "tailwind-merge";
import { AVATAR_COLORS } from "../assets/avatar";
import UICard from "./UICard";
import { useState } from "react";

export default function ColorPalette({ selected, title, onClick, className }: { selected: number, title: string, onClick: (index: number) => void, className?: string }) {
    const [isOpen, setOpen] = useState(false);
    return (
        <UICard className={className}>
            <UICard.Header>
                {title}
            </UICard.Header>
            <UICard.Body>
                {isOpen ? <div className="grid grid-cols-2 w-12">
                    {AVATAR_COLORS.map(({ bg }, i) => <div
                        key={i} onClick={(e) => { e.preventDefault(); onClick(i); setOpen(false) }} className={twJoin(bg, "size-6 cursor-pointer")} />)}
                </div> : <div onClick={(e) => { e.preventDefault(); setOpen(true) }} className={twJoin("w-12 h-6", AVATAR_COLORS[selected].bg)}></div>}
            </UICard.Body>
        </UICard>
    )
}
