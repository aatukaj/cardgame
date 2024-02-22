import { useState, } from 'react'
import type { ChatMessage } from '@bindings/ChatMessage'

function ChatBox({onMessage, messages}: {onMessage: (msg: string) => void, messages: ChatMessage[]}) {

    const [currentMesssage, setCurrentMessage] = useState("");

    return (<div className="w-1/3 flex-none h-full bg-zinc-900 border border-zinc-700 flex flex-col p-2 justify-end overflow-clip">
        <ul>
            {messages.map((msg, i) => <li key={i} className='text-white'><span>{msg.userName}:</span> <span>{msg.content}</span></li>)}
        </ul>
        <form className='w-full' onSubmit={(e) => { e.preventDefault(); if (currentMesssage.trim() != "") {onMessage(currentMesssage); setCurrentMessage("") }}}>
            <input type="text" value={currentMesssage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="chat" className=' w-full bg-zinc-800 h-10 p-1 text-white border border-zinc-700'></input>
        </form>
    </div>)
}
export default ChatBox;