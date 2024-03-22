import { useNavigate } from "react-router-dom";
import UICard from "../components/UICard";
import { UserCreate } from "@bindings/UserCreate";
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";

import { AVATAR_COLORS, EYES, TIES } from "../assets/avatar";
import ColorPalette from "../components/ColorPalette";
import { randInt } from "../util";
import Button from "../components/Button";
export default function LoginPage() {
    const navigate = useNavigate();
    const [eyeIndex, setEyeIndex] = useState(0);
    const [tieIndex, setTieIndex] = useState(0);
    const [eyeColorIndex, setEyeColorIndex] = useState(0);
    const [tieColorIndex, setTieColorIndex] = useState(0);
    function randomize() {
        setEyeIndex(randInt(EYES.length))
        setTieIndex(randInt(TIES.length))
        setTieColorIndex(randInt(AVATAR_COLORS.length))
        setEyeColorIndex(randInt(AVATAR_COLORS.length))

    }
    function onSubmit(event: React.FormEvent<HTMLFormElement>, eyeColorIndex: number, tieColorIndex: number, eyeIndex: number, tieIndex: number) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        Login({ name: formData.get("name") as string, avatar: { eyeColorIndex, tieColorIndex, eyeIndex, tieIndex } })
    }

    async function Login(data: UserCreate) {
        const response = await fetch("/api/user/login", {
            method: "POST", headers: {
                credentials: 'include',
                'Content-Type': 'application/json',

            }, body: JSON.stringify(data)
        });
        if (response.ok) {
            navigate("../lobbies")
        }
    }
    useEffect(() => {
        async function fetch_whoami() {
            const response = await fetch("/api/user/whoami");
            if (response.ok) {
                console.log(await response.json())
                navigate("../lobbies")
            }
        }
        fetch_whoami()
        randomize()
    }, [navigate])

    function incr(i: number, len: number): number {
        return (i + 1) % len
    }
    function decr(i: number, len: number): number {
        i -= 1;
        if (i < 0) {
            return len + i
        }
        return i
    }

    return <div className="flex flex-row justify-center items-center size-full gap-1">
        <UICard>
            <UICard.Header>
                Login
            </UICard.Header>
            <form onSubmit={(e) => onSubmit(e, eyeColorIndex, tieColorIndex, eyeIndex, tieIndex)}>
                <UICard.Body>
                    <div className="flex flex-col">
                        <div className="grid grid-cols-3 grid-rows-2">
                            <button
                                onClick={e => { e.preventDefault(); setEyeIndex(i => incr(i, EYES.length)) }}
                                className="text-xl font-bold justify-self-end m-3">
                                &lt;
                            </button>
                            <Avatar
                                {...{ eyeColorIndex, eyeIndex, tieColorIndex, tieIndex }}
                                className="row-span-2 col-start-2 -mx-8 pointer-events-none"
                            />
                            <button
                                onClick={e => { e.preventDefault(); setEyeIndex(i => decr(i, EYES.length)) }}
                                className="text-xl font-bold justify-self-start m-3">&gt;</button>
                            <button onClick={e => { e.preventDefault(); setTieIndex(i => incr(i, TIES.length)) }} className="text-xl font-bold justify-self-end m-3">&lt;</button>
                            <button onClick={e => { e.preventDefault(); setTieIndex(i => decr(i, TIES.length)) }} className="text-xl font-bold justify-self-start m-3">&gt;</button>
                        </div>
                        <input type='text' placeholder='Username' className='bg-zinc-800 border border-zinc-700 h-8 px-1' name='name'></input>
                    </div>
                </UICard.Body>
                <UICard.Footer>
                    <div className="flex w-full gap-1 justify-items-stretch h-8">
                        <Button variant="blue" onClick={(e) => { e.preventDefault(); randomize(); }} className="text-xl h-full" >
                            🎲
                        </Button>
                        <Button type='submit' variant="green" className='grow h-full'>Continue</Button>
                    </div>
                </UICard.Footer>
            </form>
        </UICard>
        <div className="relative"> <ColorPalette className="absolute bottom-0" selected={eyeColorIndex} title="Eye" onClick={setEyeColorIndex} />
            <ColorPalette className="absolute top-0 mt-0.5" selected={tieColorIndex} title="Tie" onClick={setTieColorIndex} />
        </div>
    </div>
}
