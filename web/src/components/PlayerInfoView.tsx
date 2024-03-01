/// <reference types="vite-plugin-svgr/client" />

import { UserData } from "@bindings/UserData";



import UICard from "./UICard";
import Avatar from "./Avatar";

export default function PlayerInfoView({ playerInfo }: { playerInfo: UserData }) {
    return (<div>
        <Avatar eyeColorIndex={2} eyeIndex={0} tieColorIndex={2} tieIndex={0} />
        <UICard>
            <UICard.Header>{playerInfo.userName}</UICard.Header>
            <UICard.Body>Cards: {playerInfo.cardCount}</UICard.Body>
        </UICard>

    </div>
    )
}