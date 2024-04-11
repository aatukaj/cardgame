use std::sync::Arc;

use futures_util::future::join_all;
use indexmap::IndexMap;
use rand::seq::SliceRandom;
use tokio::sync::mpsc;
use tracing::{error, info};
use uuid::Uuid;

use crate::{
    game::{CardKind, Color, NormalCardKind, Player, State},
    game_messages::{ChatMessage, GameState, PlayerInfo, Response},
    user::User,
    Command, LobbyData, PlayerId, Ser,
};
pub const MAX_CARD_HISTORY: usize = 8;
pub struct RoomActor {
    name: String,
    game_started: bool,
    pub players: IndexMap<PlayerId, Player>,
    max_players: usize,
    next_id: usize,
    id: Uuid,
    rx: mpsc::Receiver<Command>,
    cards_played: usize,
}
impl RoomActor {
    pub fn spawn_new(name: String, max_players: usize) -> (mpsc::Sender<Command>, Uuid) {
        let (tx, rx) = mpsc::channel(8);
        let id = Uuid::new_v4();
        let room = Self {
            name,
            game_started: false,
            next_id: 0,
            rx,
            id,
            players: IndexMap::new(),
            max_players,
            cards_played: 0,
        };
        tokio::spawn(room.run());
        (tx, id)
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
        let player_data: Vec<PlayerInfo> = self
            .players
            .values()
            .map(|p| PlayerInfo {
                user: &p.user,
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
                    direction: game_state.turn_direction,
                    cards_played: self.cards_played,
                    last_played_cards: &game_state.played_cards[game_state
                        .played_cards
                        .len()
                        .saturating_sub(MAX_CARD_HISTORY)..],
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
                Command::GetData(sender) => {
                    sender
                        .send(LobbyData {
                            name: self.name.clone(),
                            players: self.players.len(),
                            max_players: self.max_players,
                            id: self.id,
                        })
                        .unwrap();
                }
                Command::Join(user_name, sender) => {
                    self.handle_join(sender, &game_state, user_name).await;
                }
                Command::SendMessage(user_id, content) => {
                    self.handle_send_message(content, &mut game_state, user_id)
                        .await;
                }
                Command::PlayCard(user_id, i, c) => {
                    self.handle_play_special_card(&mut game_state, user_id, i, c)
                        .await;
                }
                Command::Leave(user_id) => {
                    if let Some(p) = self.players.shift_remove(&user_id) {
                        game_state.unplayed_cards.extend(p.cards.into_iter())
                    }
                }
                Command::TakeCard(user_id) => {
                    self.handle_take_card(&user_id, &mut game_state).await
                }
                Command::PlayCards(user_id, cards_ids) => {
                    self.handle_play_cards(&user_id, &mut game_state, cards_ids)
                        .await;
                }
                Command::Shutdown => break,
                Command::Noop => (),
            };
        }
    }
    async fn handle_take_card(&mut self, player_id: &PlayerId, game_state: &mut State) {
        if let Some(p) = self
            .get_mut_player_if_turn(&player_id, &game_state)
            .filter(|p| !p.can_play_card(&game_state))
        {
            p.cards.push(game_state.draw_card());
            game_state.next_turn(self);
            self.broadcast_gamestate(&game_state).await;
        }
    }
    fn get_mut_player_if_turn(
        &mut self,
        player_id: &PlayerId,
        game_state: &State,
    ) -> Option<&mut Player> {
        self.players
            .get_index_mut(game_state.turn_index)
            .and_then(|(id, p)| (id == player_id).then_some(p))
    }
    async fn handle_play_special_card(
        &mut self,
        game_state: &mut State,
        user_id: usize,
        card_index: usize,
        new_color: Color,
    ) {
        let Some(player) = self.get_mut_player_if_turn(&user_id, &game_state) else {
            return;
        };
        if player
            .cards
            .get(card_index)
            .is_some_and(|c| matches!(c.kind, CardKind::Special(_)))
        {
            let mut card = player.cards.remove(card_index);
            card.color = new_color;
            game_state.place_card(card.clone());
            game_state.next_turn(self);

            self.cards_played += 1;
            self.broadcast_gamestate(game_state).await;
        }
    }
    async fn start(&mut self, game_state: &mut State) {
        info!("STARTED");
        for p in self.players.values_mut() {
            p.cards = game_state
                .unplayed_cards
                .split_off(game_state.unplayed_cards.len() - 7);
            info!("{} got cards: {:?}", p.user.name, p.cards);
        }
        self.game_started = true;
        let index = game_state
            .unplayed_cards
            .iter()
            .rposition(|card| matches!(card.kind, CardKind::Normal(NormalCardKind::Number(_))))
            .unwrap();
        let top_card = game_state.unplayed_cards.remove(index);
        game_state.place_card(top_card);
        self.cards_played = 1;
        self.broadcast_gamestate(game_state).await;
    }
    async fn handle_send_message(
        &mut self,
        content: String,
        game_state: &mut State,
        user_id: usize,
    ) {
        if !self.game_started && content.trim() == "/start" {
            self.start(game_state).await;
        }
        self.broadcast_message(ChatMessage {
            content: &content,
            user_name: &(self.players.get(&user_id).unwrap().user).name,
        })
        .await;
    }

    async fn handle_join(
        &mut self,
        sender: tokio::sync::oneshot::Sender<Result<(usize, mpsc::Receiver<String>), String>>,
        game_state: &State,
        user: Arc<User>,
    ) {
        if self.game_started {
            sender.send(Err("Already started".into())).unwrap();
        } else if self.players.len() >= self.max_players {
            sender.send(Err("Room is full".into())).unwrap();
        } else {
            let (tx, rx) = mpsc::channel(1);
            sender.send(Ok((self.next_id, rx))).unwrap();

            self.players.insert(
                self.next_id,
                Player {
                    cards: Vec::new(),
                    tx,
                    user: Arc::clone(&user),
                },
            );
            self.next_id += 1;

            self.broadcast_message(ChatMessage {
                content: &format!(
                    "{} joined! {}/{} players.",
                    &user.name,
                    self.players.len(),
                    self.max_players
                ),
                user_name: "SERVER".into(),
            })
            .await;
            self.broadcast_gamestate(game_state).await;
        };
    }

    async fn handle_play_cards(
        &mut self,
        user_id: &usize,
        game_state: &mut State,
        card_indeces: Vec<usize>,
    ) {
        let Some(player) = self.get_mut_player_if_turn(user_id, game_state) else {
            return;
        };
        if !player.can_play_consecutive_cards(game_state, &card_indeces) {
            return;
        }
        // The player can actually play all the cards in cards_ids
        let new_cards = Vec::with_capacity(player.cards.len() - card_indeces.len());
        let player_cards = std::mem::replace(&mut player.cards, new_cards);
        for i in &card_indeces {
            game_state.place_card(player_cards[*i].clone())
        }
        player.cards = player_cards
            .into_iter()
            .enumerate()
            .filter_map(|(i, c)| (!card_indeces.contains(&i)).then(|| c))
            .collect();
        game_state.next_turn(self);
        self.cards_played += card_indeces.len();
        self.broadcast_gamestate(game_state).await;
    }
}
