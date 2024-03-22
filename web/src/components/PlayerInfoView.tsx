/// <reference types="vite-plugin-svgr/client" />

import { PlayerInfo } from "@bindings/PlayerInfo";



import UICard from "./UICard";
import Avatar from "./Avatar";

export default function PlayerInfoView({ playerInfo, selected = false }: { playerInfo: PlayerInfo, selected?: boolean }) {
    return (<div>
        <Avatar
            eyeColorIndex={playerInfo.user.avatar.eyeColorIndex}
            eyeIndex={playerInfo.user.avatar.eyeIndex}
            tieColorIndex={playerInfo.user.avatar.tieColorIndex}
            tieIndex={playerInfo.user.avatar.tieIndex}
        />
        <UICard className={"outline outline-2 outline-white/50"}>
            <UICard.Header>{playerInfo.user.name}</UICard.Header>
            <UICard.Body>Cards: {playerInfo.cardCount}</UICard.Body>
        </UICard>

    </div>
    )
}
