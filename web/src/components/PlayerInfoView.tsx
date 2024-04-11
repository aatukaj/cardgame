/// <reference types="vite-plugin-svgr/client" />

import { PlayerInfo } from "@bindings/PlayerInfo";



import UICard from "./UICard";
import Avatar from "./Avatar";
import { twJoin } from "tailwind-merge";

export default function PlayerInfoView({ playerInfo, selected = false }: { playerInfo: PlayerInfo, selected?: boolean }) {
    return (<div>
        <Avatar
            {...playerInfo.user.avatar}
        />
        <UICard className={twJoin(selected && "ring-2 ring-offset-2 ring-offset-zinc-900 ring-white/50")}>
            <UICard.Header>{playerInfo.user.name}</UICard.Header>
            <UICard.Body>Cards: {playerInfo.cardCount}</UICard.Body>
        </UICard>

    </div>
    )
}
