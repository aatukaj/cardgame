import React from 'react'
import ReactDOM from 'react-dom/client'
import Game from './routes/Game.tsx'
import './index.css'
import Root from './routes/root.tsx'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Lobbies from './routes/Lobbies.tsx';
import LoginPage from './routes/Login.tsx'




const router = createBrowserRouter([
  {
    id: "root", 
    path: "/", 
    Component: Root, 
    children: [{
      path: "lobbies",
      Component: Lobbies,
    }, {
      path: "lobbies/play/:lobbyId",
      Component: Game,
    }, {
      path: "login",
      Component: LoginPage,
    }]
  }

]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
