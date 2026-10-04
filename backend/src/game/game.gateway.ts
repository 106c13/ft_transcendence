import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { Chess } from 'chess.js';
import { GameService } from './game.service';
import { UsersService } from '../users/users.service';
import { getRatingCategory, RatingService } from './rating.service';
import { PresenceService } from '@/presence/presence.service';
import { ChallengeGateway } from './challenge.gateway';

@WebSocketGateway({
	namespace: '/game',
	cors: {
		origin: true,
		credentials: true,
	},
})

export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Namespace;

	constructor(
		private gameService: GameService,
		private usersService: UsersService,
		private ratingService: RatingService,
		private presenceService: PresenceService,
		private challengeGateway: ChallengeGateway,
	) {
		// Provide active games checker to presence service
		this.presenceService.setInGameChecker((userId: number) => {
			return !!this.gameService.getGameByUserId(userId);
		});

		// Track every game creation (matchmaking queue, direct challenge, rematch)
		this.gameService.setGameCreatedCallback((newGame) => {
			this.presenceService.setUserInGame(newGame.white.userId, true);
			this.presenceService.setUserInGame(newGame.black.userId, true);

			this.challengeGateway.server.emit('user_status_changed', {
				userId: newGame.white.userId,
				username: newGame.white.username,
				status: 'INGAME',
				gameId: newGame.gameId,
			});
			this.challengeGateway.server.emit('user_status_changed', {
				userId: newGame.black.userId,
				username: newGame.black.username,
				status: 'INGAME',
				gameId: newGame.gameId,
			});
		});

		// Register events callback from service to notify clients
		this.gameService.setGameEventsCallback((event, game, payload) => {
			this.server.to(game.gameId).emit(event, payload);

			if (event === 'game_over') {
				this.presenceService.setUserInGame(game.white.userId, false);
				this.presenceService.setUserInGame(game.black.userId, false);

				this.challengeGateway.server.emit('user_status_changed', {
					userId: game.white.userId,
					username: game.white.username,
					status: this.presenceService.getUserStatus(game.white.userId),
				});
				this.challengeGateway.server.emit('user_status_changed', {
					userId: game.black.userId,
					username: game.black.username,
					status: this.presenceService.getUserStatus(game.black.userId),
				});
			}
		});

		this.gameService.setMatchFoundCallback(async (newGame) => {
			const roomName = newGame.gameId;

			const whiteSocket = this.server.sockets.get(newGame.white.socketId);
			const blackSocket = this.server.sockets.get(newGame.black.socketId);
			if (whiteSocket) whiteSocket.join(roomName);
			if (blackSocket) blackSocket.join(roomName);

			const category = getRatingCategory(newGame.mode);
			const whiteRating = await this.ratingService.getMatchmakingRating(newGame.white.userId, category);
			const blackRating = await this.ratingService.getMatchmakingRating(newGame.black.userId, category);

			const matchHistory = newGame.board.history ? newGame.board.history() : [];

			const whitePayload = {
				gameId: newGame.gameId, color: 'w', opponentName: newGame.black.username,
				fen: newGame.board.fen(), whiteTime: newGame.whiteTime, blackTime: newGame.blackTime,
				turn: newGame.board.turn(), history: matchHistory, mode: newGame.mode, isPaused: false,
				playerRating: whiteRating.rating, playerIsProvisional: whiteRating.isProvisional,
				opponentRating: blackRating.rating, opponentIsProvisional: blackRating.isProvisional,
			};

			const blackPayload = {
				gameId: newGame.gameId, color: 'b', opponentName: newGame.white.username,
				fen: newGame.board.fen(), whiteTime: newGame.whiteTime, blackTime: newGame.blackTime,
				turn: newGame.board.turn(), history: matchHistory, mode: newGame.mode, isPaused: false,
				playerRating: blackRating.rating, playerIsProvisional: blackRating.isProvisional,
				opponentRating: whiteRating.rating, opponentIsProvisional: whiteRating.isProvisional,
			};

			if (whiteSocket) {
				whiteSocket.emit('match_found', whitePayload);
			} else {
				this.server.to(newGame.white.socketId).emit('match_found', whitePayload);
			}

			if (blackSocket) {
				blackSocket.emit('match_found', blackPayload);
			} else {
				this.server.to(newGame.black.socketId).emit('match_found', blackPayload);
			}
		});
	}

	async handleConnection(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		console.log(`Game Gateway: User ${userId} connected (Socket: ${client.id})`);
		await this.presenceService.handleUserConnect(userId, client.id);
	}

	async handleDisconnect(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string, 10);
		console.log(`Game Gateway: User ${userId} disconnected (Socket: ${client.id})`);

		await this.presenceService.handleUserDisconnect(userId, client.id);
		// Trigger grace period only if this was their active socket
		this.gameService.handleUserDisconnect(userId, client.id);
	}

	@SubscribeMessage('join_game')
	async handleJoinGame(client: Socket, payload: { gameId: string; preview?: boolean }) {
		const userIdStr = client.handshake.query.userId;
		const userId = userIdStr ? parseInt(userIdStr as string, 10) : undefined;
		const gameId = payload?.gameId;
		if (!gameId) {
			client.emit('error', { message: 'missing_game_id' });
			return;
		}

		const session = await this.gameService.getGameSession(gameId, userId);
		if (session.type === 'not_found') {
			client.emit('error', { message: 'game_not_found' });
			return;
		}

		client.join(gameId);

		if (session.type === 'live' && session.game) {
			const game = session.game;
			if (session.role === 'player' && userId && !payload?.preview) {
				this.gameService.handleUserReconnect(userId, client.id);
			}

			const category = getRatingCategory(game.mode);
			const whiteRating = await this.ratingService.getMatchmakingRating(game.white.userId, category);
			const blackRating = await this.ratingService.getMatchmakingRating(game.black.userId, category);
			const whiteUser = await this.usersService.findById(game.white.userId);
			const blackUser = await this.usersService.findById(game.black.userId);

			const matchHistory = game.board.history ? game.board.history() : [];

			const payloadData = {
				gameId: game.gameId,
				role: session.role,
				color: session.color,
				opponentName: session.color === 'w' ? game.black.username : game.white.username,
				opponentAvatar: session.color === 'w' ? blackUser?.avatar : whiteUser?.avatar,
				playerAvatar: session.color === 'w' ? whiteUser?.avatar : blackUser?.avatar,
				fen: game.board.fen(),
				whiteTime: game.whiteTime,
				blackTime: game.blackTime,
				turn: game.board.turn(),
				history: matchHistory,
				moveTimes: game.moveTimes || [],
				mode: game.mode,
				isPaused: game.disconnectedPlayerIds.size > 0,
				isGameOver: false,
				playerRating: session.color === 'w' ? whiteRating.rating : blackRating.rating,
				playerIsProvisional: session.color === 'w' ? whiteRating.isProvisional : blackRating.isProvisional,
				opponentRating: session.color === 'w' ? blackRating.rating : whiteRating.rating,
				opponentIsProvisional: session.color === 'w' ? blackRating.isProvisional : whiteRating.isProvisional,
				whitePlayer: {
					id: game.white.userId,
					username: game.white.username,
					avatar: whiteUser?.avatar,
					rating: whiteRating.rating,
					isProvisional: whiteRating.isProvisional,
				},
				blackPlayer: {
					id: game.black.userId,
					username: game.black.username,
					avatar: blackUser?.avatar,
					rating: blackRating.rating,
					isProvisional: blackRating.isProvisional,
				},
			};

			client.emit('game_state', payloadData);
			client.emit('match_found', payloadData);
			return;
		}

		if (session.type === 'finished' && session.match) {
			const match = session.match;
			const replay = new Chess();
			if (match.pgn) {
				try {
					replay.loadPgn(match.pgn);
				} catch { }
			}

			const payloadData = {
				gameId: String(match.id),
				role: session.role,
				color: session.color,
				opponentName: session.color === 'w' ? match.black?.username : match.white?.username,
				opponentAvatar: session.color === 'w' ? match.black?.avatar : match.white?.avatar,
				playerAvatar: session.color === 'w' ? match.white?.avatar : match.black?.avatar,
				fen: replay.fen(),
				whiteTime: 0,
				blackTime: 0,
				turn: replay.turn(),
				history: replay.history(),
				moveTimes: match.move_times || [],
				mode: match.mode,
				isPaused: false,
				isGameOver: true,
				winner: match.winner_id === match.white_id ? 'w' : (match.winner_id === match.black_id ? 'b' : null),
				reason: match.result,
				savedMatchId: match.id,
				playerRating: session.color === 'w' ? match.white_rating_after : match.black_rating_after,
				playerIsProvisional: false,
				opponentRating: session.color === 'w' ? match.black_rating_after : match.white_rating_after,
				opponentIsProvisional: false,
				whitePlayer: {
					id: match.white?.id || match.white_id,
					username: match.white?.username || 'White',
					avatar: match.white?.avatar,
					rating: match.white_rating_after,
					isProvisional: false,
					ratingDelta: match.white_rating_delta,
				},
				blackPlayer: {
					id: match.black?.id || match.black_id,
					username: match.black?.username || 'Black',
					avatar: match.black?.avatar,
					rating: match.black_rating_after,
					isProvisional: false,
					ratingDelta: match.black_rating_delta,
				},
			};

			client.emit('game_state', payloadData);
			client.emit('match_found', payloadData);
		}
	}

	@SubscribeMessage('find_match')
	async handleFindMatch(client: Socket, payload: { mode: 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2' }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) {
			client.emit('error', { message: 'unauthorized' });
			return;
		}

		const userId = parseInt(userIdStr as string);
		const user = await this.usersService.findById(userId);
		if (!user) {
			client.emit('error', { message: 'user_not_found' });
			return;
		}

		const mode = payload?.mode || 'blitz';
		console.log(`Game Gateway: User ${userId} (${user.username}) searching match in mode ${mode}`);
		const matchGame = await this.gameService.addToQueue(userId, client.id, user.username, mode);

		if (matchGame) {
			console.log(`Game Gateway: Match found ${matchGame.gameId}: ${matchGame.white.username} vs ${matchGame.black.username}`);
			const roomName = matchGame.gameId;

			// Ensure calling client socket is updated and joins the room
			if (matchGame.white.userId === userId) {
				matchGame.white.socketId = client.id;
			} else if (matchGame.black.userId === userId) {
				matchGame.black.socketId = client.id;
			}
			client.join(roomName);

			// Sockets join room
			const whiteSocket = this.server.sockets.get(matchGame.white.socketId);
			const blackSocket = this.server.sockets.get(matchGame.black.socketId);

			if (whiteSocket) whiteSocket.join(roomName);
			if (blackSocket) blackSocket.join(roomName);

			const matchHistory = matchGame.board.history ? matchGame.board.history() : [];

			const category = getRatingCategory(matchGame.mode);
			const whiteRating = await this.ratingService.getMatchmakingRating(matchGame.white.userId, category);
			const blackRating = await this.ratingService.getMatchmakingRating(matchGame.black.userId, category);
			const whiteUser = await this.usersService.findById(matchGame.white.userId);
			const blackUser = await this.usersService.findById(matchGame.black.userId);

			// Notify White
			const whitePayload = {
				gameId: matchGame.gameId,
				color: 'w',
				opponentName: matchGame.black.username,
				opponentAvatar: blackUser?.avatar,
				playerAvatar: whiteUser?.avatar,
				fen: matchGame.board.fen(),
				whiteTime: matchGame.whiteTime,
				blackTime: matchGame.blackTime,
				turn: matchGame.board.turn(),
				history: matchHistory,
				mode: matchGame.mode,
				isPaused: matchGame.disconnectedPlayerIds.size > 0,
				playerRating: whiteRating.rating,
				playerIsProvisional: whiteRating.isProvisional,
				opponentRating: blackRating.rating,
				opponentIsProvisional: blackRating.isProvisional,
			};
			if (whiteSocket) {
				whiteSocket.emit('match_found', whitePayload);
			} else {
				this.server.to(matchGame.white.socketId).emit('match_found', whitePayload);
			}

			// Notify Black
			const blackPayload = {
				gameId: matchGame.gameId,
				color: 'b',
				opponentName: matchGame.white.username,
				opponentAvatar: whiteUser?.avatar,
				playerAvatar: blackUser?.avatar,
				fen: matchGame.board.fen(),
				whiteTime: matchGame.whiteTime,
				blackTime: matchGame.blackTime,
				turn: matchGame.board.turn(),
				history: matchHistory,
				mode: matchGame.mode,
				isPaused: matchGame.disconnectedPlayerIds.size > 0,
				playerRating: blackRating.rating,
				playerIsProvisional: blackRating.isProvisional,
				opponentRating: whiteRating.rating,
				opponentIsProvisional: whiteRating.isProvisional,
			};
			if (blackSocket) {
				blackSocket.emit('match_found', blackPayload);
			} else {
				this.server.to(matchGame.black.socketId).emit('match_found', blackPayload);
			}
		}
	}


	@SubscribeMessage('make_move')
	handleMakeMove(
		client: Socket,
		payload: { gameId: string; from: string; to: string; promotion?: string; isPremove?: boolean }
	) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const result = this.gameService.makeMove(
			payload.gameId,
			userId,
			payload.from,
			payload.to,
			payload.promotion,
			payload.isPremove
		);

		if (result.error) {
			client.emit('error', { message: result.error });
		} else {
			this.server.to(payload.gameId).emit('move_made', {
				fen: result.fen,
				san: result.san,
				lastMove: result.move,
				turn: result.turn,
				whiteTime: result.whiteTime,
				blackTime: result.blackTime,
				isCheck: result.isCheck,
				isGameOver: result.isGameOver,
				timeSpent: result.timeSpent,
			});
		}
	}

	@SubscribeMessage('cancel_queue')
	handleCancelQueue(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string, 10);
		console.log(`Game Gateway: User ${userId} cancelled queue`);
		this.gameService.removeFromQueue(userId);
	}

	@SubscribeMessage('resign_game')
	handleResignGame(client: Socket, payload: { gameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string, 10);
		if (payload && payload.gameId) {
			console.log(`Game Gateway: User ${userId} resigned game ${payload.gameId}`);
			this.gameService.resign(payload.gameId, userId);
		}
	}

	@SubscribeMessage('abandon_game')
	handleAbandonGame(client: Socket, payload: { gameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string, 10);
		if (payload && payload.gameId) {
			console.log(`Game Gateway: User ${userId} abandoned game ${payload.gameId}`);
			this.gameService.resign(payload.gameId, userId);
		}
	}

	@SubscribeMessage('leave_game')
	handleLeaveGame(client: Socket, payload?: { gameId?: string }) {
		if (payload && payload.gameId) {
			this.handleResignGame(client, { gameId: payload.gameId });
		} else {
			this.handleCancelQueue(client);
		}
	}

	@SubscribeMessage('draw_offer')
	handleDrawOffer(client: Socket, payload: { gameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const gameId = payload?.gameId;
		if (!gameId) return;

		const result = this.gameService.offerDraw(gameId, userId);
		if (result.success) {
			if (result.opponentSocketId) {
				this.server.to(result.opponentSocketId).emit('draw_offered', { gameId, fromUserId: userId });
			}
			client.to(gameId).emit('draw_offered', { gameId, fromUserId: userId });
		}
	}

	@SubscribeMessage('draw_accept')
	handleDrawAccept(client: Socket, payload: { gameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const gameId = payload?.gameId;
		if (!gameId) return;

		this.gameService.acceptDraw(gameId, userId);
	}

	@SubscribeMessage('draw_decline')
	handleDrawDecline(client: Socket, payload: { gameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const gameId = payload?.gameId;
		if (!gameId) return;

		const result = this.gameService.declineDraw(gameId, userId);
		if (result.success) {
			if (result.requesterSocketId) {
				this.server.to(result.requesterSocketId).emit('draw_declined', { gameId });
			}
			client.to(gameId).emit('draw_declined', { gameId });
		}
	}
}
