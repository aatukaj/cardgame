import { Outlet } from "react-router-dom";



export default function Root() {
    return <div className="font-poppins font-normal w-screen h-screen text-white bg-zinc-950 overflow-clip flex flex-col">
        <div className="w-full h-6 bg-zinc-900 border-b border-zinc-700 flex-none"> </div>
        <div className="w-full flex-1 p-4 min-h-0">
            <Outlet />
        </div>

    </div>
}
