import { useState, useEffect } from 'react'
import type { LobbyData } from '@bindings/LobbyData'
import type { CreateLobbyData } from '@bindings/CreateLobbyData'
import { Link, useNavigate } from 'react-router-dom';

import { UserGroupIcon } from '@heroicons/react/24/outline'
import UICard from '../components/UICard';

export default function Lobbies() {
    const [lobbies, setLobbies] = useState<LobbyData[]>([]);
    const navigate = useNavigate();

    async function fetchLobbies() {
        const response = await fetch("http://127.0.0.1:8080/lobbies");
        const lobbies: LobbyData[] = await response.json();
        console.log(lobbies);
        setLobbies(lobbies);
    }
    useEffect(() => {
        fetchLobbies()
    }, []);
    async function createLobby(data: CreateLobbyData) {
        const response = await fetch("http://127.0.0.1:8080/lobbies", {
            method: "POST", headers: {
                'Content-Type': 'application/json',
            }, body: JSON.stringify(data)
        });
        console.log(response);
        if (response.ok) {
            navigate(`play/${await response.json()}`);
        } else {
            alert(await response.text())
        }

    }
    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        createLobby({ name: formData.get("name") as string, max_players: Number(formData.get("max_players")) })
    }

    return <div className=' w-full h-full flex flex-row gap-4'>
        <div className='overflow-y-auto h-full border-zinc-700 border bg-zinc-900'>
            <table className='border-collapse table-fixed text-lg w-full'>
                <thead className='sticky top-0'>
                    <tr>
                        <td className='border-zinc-700 bg-zinc-800 py-2 pl-2'>Name</td>
                        <td className=' border-zinc-700 bg-zinc-800 py-2 pl-2'>Players</td>
                    </tr>
                </thead>
                <tbody>
                    {lobbies.map((lobby, i) =>
                        <tr key={i}>
                            <td className='border-y border-zinc-700 py-2 pl-2'>{lobby.name}</td>
                            <td className='border-y border-zinc-700 py-2 pl-2'>{lobby.players}/{lobby.max_players} <Link to={`play/${lobby.id}`}> Join </Link> </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className='self-start basis-1/5 flex-none'>
            <UICard>
                <UICard.Header>
                    Create Lobby
                </UICard.Header>
                <form className='text-white flex flex-col gap-2 p-2' onSubmit={onSubmit}>
                    <input type='text' placeholder='Lobby name' className='bg-zinc-800 border border-zinc-700 h-8' name='name'></input>

                    <div className='flex flex-row bg-zinc-800 border border-zinc-700'>
                        <UserGroupIcon className='w-8 h-8 float-left' />
                        <input type='number' defaultValue={4} max={8} min={2} className='bg-inherit w-full' name='max_players' />
                    </div>
                    <input type='submit' value='Create' className=' w-full h-8 bg-green-500 border  border-green-400' />
                </form>
            </UICard>

        </div>

    </div>

}