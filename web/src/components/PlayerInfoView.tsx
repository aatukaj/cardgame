/// <reference types="vite-plugin-svgr/client" />

import { PlayerInfo } from "@bindings/PlayerInfo";



import UICard from "./UICard";
import Avatar from "./Avatar";

export default function PlayerInfoView({ playerInfo }: { playerInfo: PlayerInfo }) {
    return (<div>
        <Avatar
            eyeColorIndex={playerInfo.user.eyeColorIndex} 
            eyeIndex={playerInfo.user.eyeIndex} 
            tieColorIndex={playerInfo.user.tieColorIndex} 
            tieIndex={playerInfo.user.tieIndex}
        />
        <UICard>
            <UICard.Header>{playerInfo.user.name}</UICard.Header>
            <UICard.Body>Cards: {playerInfo.cardCount}</UICard.Body>
        </UICard>

    </div>
    )
}