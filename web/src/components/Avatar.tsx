const AVATAR_COLORS = ["text-blue-500", "text-red-500", "text-purple-500", "text-green-500"];

import { twJoin, twMerge } from "tailwind-merge";
import Player from "../assets/player_body.svg?react";
import PlayerEye from "../assets/player_eye2.svg?react";

export default function Avatar({ eyeColorIndex, eyeIndex, tieColorIndex, tieIndex, className="" }: { eyeColorIndex: number, eyeIndex: number, tieColorIndex: number, tieIndex: number, className?: string }) {
    
    return (
        <div className={twMerge("w-32 h-32 relative", className)}>
            <Player className={twJoin('translate-y-3 size-full absolute', AVATAR_COLORS[tieColorIndex])} />
            <PlayerEye className={twJoin('translate-y-3 size-full absolute text-blue-500', AVATAR_COLORS[eyeColorIndex])} />
        </div>
    )
}