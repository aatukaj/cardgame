

import { twJoin, twMerge } from "tailwind-merge";
import Body from "../assets/player_body.svg?react";
import Head from "../assets/player_head.svg?react";

import { EYES, TIES, AVATAR_COLORS } from "../assets/avatar.ts"


export default function Avatar({ eyeColorIndex, eyeIndex, tieColorIndex, tieIndex, className = "" }: { eyeColorIndex: number, eyeIndex: number, tieColorIndex: number, tieIndex: number, className?: string }) {
    const Eye = EYES[eyeIndex] || EYES[0];
    const Tie = TIES[tieIndex] || TIES[0];
    return (
        <div className={twMerge("w-32 h-32 relative translate-y-3", className)}>
            <Body className={' size-full absolute'} />
            <Tie className={twJoin('size-full absolute', AVATAR_COLORS[tieColorIndex].text)} />
            <Head className={' size-full absolute'} />
            <Eye className={twJoin('size-full absolute', AVATAR_COLORS[eyeColorIndex].text)} />
        </div>
    )
}