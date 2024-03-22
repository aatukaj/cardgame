import { PlayerInfo } from "@bindings/PlayerInfo";
import PlayerInfoView from "./PlayerInfoView";

export default function PlayerCarousel({ playerInfos, selected }: { playerInfos: PlayerInfo[], selected: number }) {

    return (
        <div className='flex flex-row gap-4'>
            {playerInfos.map((p, i) => <PlayerInfoView playerInfo={p} key={i} />)}
        </div>
    )
}

