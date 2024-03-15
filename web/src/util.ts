import { Color } from "@bindings/Color";

export const COLOR_TO_BG: Record<Color, string> = {
    "Red": "bg-red-500",
    "Yellow": "bg-yellow-500",
    "Green": "bg-green-500",
    "Blue": "bg-blue-500",
    "None": "bg-zinc-500",
}

export function randInt(end: number): number {
    return Math.floor(Math.random() * end)
}

export function last<T>(ls: T[]): T {
    return ls[ls.length - 1]
}
