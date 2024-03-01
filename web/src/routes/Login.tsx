import { useNavigate } from "react-router-dom";
import UICard from "../components/UICard";
import { LoginData } from "@bindings/LoginData"
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";

export default function LoginPage() {
    const navigate = useNavigate();
    const [eyeIndex, setEyeIndex] = useState(0);
    const [tieIndex, setTieIndex] = useState(0);

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        Login({ userName: formData.get("name") as string, })
    }

    async function Login(data: LoginData) {
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

    }, [navigate])

    return <div className="flex flex-col justify-center items-center w-full h-full">
        <UICard>
            <UICard.Header>
                Login
            </UICard.Header>
            <form onSubmit={onSubmit}>
                <UICard.Body>
                    <div className="flex flex-col">
                        <div className="grid grid-cols-3 grid-rows-2">
                            <button onClick={() => setEyeIndex(i => i+1)} className="text-xl font-bold justify-self-end m-3">&lt;</button>
                            <Avatar eyeColorIndex={eyeIndex} eyeIndex={0} tieColorIndex={tieIndex} tieIndex={0} className="row-span-2 col-start-2 -mx-8 pointer-events-none" />
                            <button onClick={() => setEyeIndex(i => i-1)} className="text-xl font-bold justify-self-start m-3">&gt;</button>
                            <button onClick={() => setTieIndex(i => i+1)} className="text-xl font-bold justify-self-end m-3">&lt;</button>
                            <button onClick={() => setTieIndex(i => i-1)} className="text-xl font-bold justify-self-start m-3">&gt;</button>
                        </div>
                        <input type='text' placeholder='Username' className='bg-zinc-800 border border-zinc-700 h-8 px-1' name='name'></input>
                    </div>
                </UICard.Body>
                <UICard.Footer>
                    <input type='submit' value='Continue' className=' w-full h-8 bg-green-500 border  border-green-400 px-2' />
                </UICard.Footer>
            </form>
        </UICard>
    </div>
}