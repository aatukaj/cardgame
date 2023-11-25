use futures_util::future::join_all;
use indexmap::IndexMap;
use log::{error, info};
use rand::seq::SliceRandom;
use tokio::sync::mpsc;

use crate::{
    game::{Player, State},
    messages::{ChatMessage, GameState, Response, UserData},
    Command, PlayerId, Ser,
};

const MAX_PLAYERS: usize = 6;

pub struct Room {
    game_started: bool,
    pub players: IndexMap<PlayerId, Player>,
    next_id: usize,
    rx: mpsc::Receiver<Command>,
}
impl Room {
    pub fn new(rx: mpsc::Receiver<Command>) -> Self {
        Self {
            game_started: false,
            players: IndexMap::new(),
            next_id: 0,
            rx,
        }
    }
    async fn broadcast_message(&self, message: ChatMessage<'_>) {
        let data = Response::ChatMessage(message).ser();
        join_all(
            self.players
                .values()
                .map(|player| player.tx.send(data.clone())),
        )
        .await;
    }
    async fn broadcast_gamestate(&self, game_state: &State) {
        let top_card = game_state.played_cards.last();
        let player_data: Vec<UserData> = self
            .players
            .values()
            .map(|p| UserData {
                user_name: &p.user_name,
                card_count: p.cards.len(),
            })
            .collect();
        for (i, p) in self.players.values().enumerate() {
            p.tx.send(
                Response::GameState(GameState {
                    users: &player_data,
                    own_cards: &p.cards,
                    turn_index: game_state.turn_index,
                    top_card,
                    self_index: i,
                })
                .ser(),
            )
            .await
            .unwrap_or_else(|e| error!("{e}"));
        }
    }
    pub async fn run(mut self) {
        let mut game_state = State::default();
        game_state.unplayed_cards.shuffle(&mut rand::thread_rng());
        while let Some(cmd) = self.rx.recv().await {
            match cmd {
                Command::Join(sender) => {
                    self.handle_join(sender, &game_state).await;
                }
                Command::SendMessage(user_id, content) => {
                    self.handle_send_message(content, &mut game_state, user_id)
                        .await;
                }
                Command::PlayCard(user_id, i) => {
                    self.handle_play_card(&mut game_state, user_id, i).await;
                }
                Command::Leave(user_id) => {
                    if let Some(p) = self.players.shift_remove(&user_id) {
                        game_state.unplayed_cards.extend(p.cards.into_iter())
                    }
                }
                Command::Noop => (),
            };
        }
    }

    async fn handle_play_card(
        &mut self,
        game_state: &mut State,
        user_id: usize,
        card_index: usize,
    ) {
        let Some(player) = self
            .players
            .get_index_mut(game_state.turn_index)
            .and_then(|(id, p)| (id == &user_id).then_some(p))
        else {
            error!("Player does not exist");
            return;
        };
        if player
            .cards
            .get(card_index)
            .is_some_and(|c| game_state.can_play(c))
        {
            game_state
                .played_cards
                .push(player.cards.remove(card_index));
            game_state.next_turn(&self);
            self.broadcast_gamestate(&*game_state).await;
        }
    }

    async fn handle_send_message(
        &mut self,
        content: String,
        game_state: &mut State,
        user_id: usize,
    ) {
        if !self.game_started && content.trim() == "/start" {
            info!("STARTED");
            for p in self.players.values_mut() {
                p.cards = game_state
                    .unplayed_cards
                    .split_off(game_state.unplayed_cards.len() - 7);
                info!("{} got cards: {:?}", p.user_name, p.cards);
            }
            self.game_started = true;
            self.broadcast_gamestate(&*game_state).await;
        }
        self.broadcast_message(ChatMessage {
            content: content.into(),
            user_name: (&self.players.get(&user_id).unwrap().user_name).into(),
        })
        .await;
    }

    async fn handle_join(
        &mut self,
        sender: tokio::sync::oneshot::Sender<Result<(usize, mpsc::Receiver<String>), String>>,
        game_state: &State,
    ) {
        if self.game_started {
            sender.send(Err("Already started".into())).unwrap();
        } else if self.players.len() > MAX_PLAYERS {
            sender.send(Err("Room is full".into())).unwrap();
        } else {
            let (tx, rx) = mpsc::channel(1);
            sender.send(Ok((self.next_id, rx))).unwrap();

            let mut user_name: String = uuid::Uuid::new_v4().to_string();
            user_name.truncate(4);
            self.broadcast_message(ChatMessage {
                content: format!("{user_name} joined!").into(),
                user_name: "SERVER".into(),
            })
            .await;
            self.players.insert(
                self.next_id,
                Player {
                    cards: Vec::new(),
                    tx,
                    user_name,
                },
            );
            self.next_id += 1;
            self.broadcast_gamestate(game_state).await;
        };
    }
}
