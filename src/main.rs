mod messages;
pub mod game;
mod room;

use std::{env, io::Error};

use futures_util::{
    future, future::join_all, stream::select_all, SinkExt, StreamExt, TryStreamExt,
};
use log::{error, info};
use messages::{GameState, Request, UserData};
use serde::Serialize;
use tokio::{
    net::{TcpListener, TcpStream},
    select,
    sync::{mpsc, oneshot},
};
use tokio_tungstenite::tungstenite::{
    protocol::{frame::coding::CloseCode, CloseFrame},
    Message,
};


type PlayerId = usize;

pub enum Command {
    SendMessage(PlayerId, String),
    Join(oneshot::Sender<Result<(PlayerId, mpsc::Receiver<String>), String>>),
    Leave(PlayerId),
    PlayCard(PlayerId, usize),
    Noop,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    env_logger::builder()
        .filter_level(log::LevelFilter::Debug)
        .try_init()
        .unwrap();
    let addr = env::args()
        .nth(1)
        .unwrap_or_else(|| "127.0.0.1:8080".to_string());

    // Create the event loop and TCP listener we'll accept connections on.
    let try_socket = TcpListener::bind(&addr).await;
    let listener = try_socket.expect("Failed to bind");
    info!("Listening on: {}", addr);

    let (tx, rx) = mpsc::channel::<Command>(8);
    let room = room::Room::new(rx);
    tokio::spawn(room.run());

    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(handle_connection(stream, tx.clone()));
    }

    Ok(())
}

trait Ser: Serialize {
    fn ser(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
}
impl<T> Ser for T where T: Serialize {}



async fn handle_connection(stream: TcpStream, tx: mpsc::Sender<Command>) {
    let addr = stream
        .peer_addr()
        .expect("connected streams should have a peer address");
    info!("Peer address: {}", addr);

    let mut ws_stream = tokio_tungstenite::accept_async(stream)
        .await
        .expect("Error during the websocket handshake occurred");

    info!("New WebSocket connection: {}", addr);

    let (oneshot_tx, oneshot_rx) = oneshot::channel();

    tx.send(Command::Join(oneshot_tx)).await.unwrap();
    let res = oneshot_rx.await.unwrap();
    let Ok((self_id, mut room_rx)) = res else {
        ws_stream
            .close(Some(CloseFrame {
                code: CloseCode::Invalid,
                reason: "uh oh".into(),
            }))
            .await
            .unwrap();
        return;
    };

    let (mut write, mut read) = ws_stream.split();
    loop {
        select! {
            Some(Ok(msg)) = read.next() => {
                info!("Request: {msg:?}");
                match msg {
                    Message::Text(txt) => {
                        let Ok(i) = serde_json::from_str::<Request>(&txt) else {break;};
                        tx.send(match i {
                            Request::SendMessage{content} => Command::SendMessage(self_id, content),
                            Request::PlayCard(i) => Command::PlayCard(self_id, i)
                        }).await.unwrap();
                    },
                    Message::Close(_) => {
                        break;
                    }
                    v => error!("weird data: {v:?}")
                }
            }
            Some(msg) = room_rx.recv() => {
                info!("Response: {msg:?}");
                write.send(Message::Text(msg)).await.unwrap();
            }
        }
    }
    tx.send(Command::Leave(self_id)).await.unwrap();
}

