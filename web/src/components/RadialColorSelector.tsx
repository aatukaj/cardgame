import { Color } from "@bindings/Color";
import { COLOR_TO_BG } from "../util";

function RadialColorSelector({ onClick }: { onClick: (c: Color) => void }) {
    return (<div className='h-24 border-4 rounded-full aspect-square border-zinc-200 bg-zinc-900 grid grid-cols-2 overflow-hidden p-1'>
        {
            (Array<Color>("Red", "Green", "Blue", "Yellow")).map(
                (c, i) =>
                    <div
                        onClick={() => onClick(c)}
                        key={i}
                        className={`${COLOR_TO_BG[c]} ${["rounded-tl-full origin-bottom-right", "rounded-tr-full origin-bottom-left", "rounded-bl-full origin-top-right", "rounded-br-full origin-top-left"][i]}  cursor-pointer h-full hover:scale-105 w-full hover:brightness-125 transition-all`}>
                    </div>)
        }
    </div>)

}
export default RadialColorSelector;