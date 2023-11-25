import { useState, useEffect } from 'react'
import type { ChatMessage } from '@bindings/ChatMessage'
import type { Response } from '@bindings/Response'
import type { Request } from '@bindings/Request'

import useWebSocket, { ReadyState } from 'react-use-websocket'

function ChatBox() {
    const {sendJsonMessage, lastJsonMessage } = useWebSocket<Response>("ws://127.0.0.1:8080", { share: true });
    const [currentMesssage, setCurrentMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    useEffect(() => {
        const msg = lastJsonMessage;
        if (msg?.tag === "ChatMessage") {
            setMessages(m => m.concat(msg.fields))
        }
    }, [lastJsonMessage])

    
    return (<div className="w-full h-full bg-zinc-900 ml-4 rounded-md flex flex-col p-1 flex-1 justify-end">
        <ul>
            {messages.map((msg, i) => <li key={i} className='text-white'><span>{msg.user_name}:</span> <span>{msg.content}</span></li>)}
        </ul>
        <form className='w-full' onSubmit={(e) => { e.preventDefault(); if (currentMesssage.trim() != "") { sendJsonMessage({tag: "SendMessage", fields: {content:currentMesssage}}); setCurrentMessage("") }}}>
            <input type="text" value={currentMesssage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="chat" className=' w-full bg-zinc-800 h-10 rounded-md p-1 text-white'></input>
        </form>
    </div>)
}
export default ChatBox;