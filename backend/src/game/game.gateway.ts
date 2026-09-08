import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket, Namespace } from 'socket.io';
import { GameService } from './game.service';
import { UsersService } from '../users/users.service';

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
	) {
		// Register events callback from service to notify clients
		this.gameService.setGameEventsCallback((event, game, payload) => {
			this.server.to(game.gameId).emit(event, payload);
		});
	}

	async handleConnection(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		console.log(`Game Gateway: User ${userId} connected (Socket: ${client.id})`);

		// Resume match if reconnected
		const reconnectedGame = this.gameService.handleUserReconnect(userId, client.id);
		if (reconnectedGame) {
			client.join(reconnectedGame.gameId);
			
			// Send full state to reconnecting player
			client.emit('match_found', {
				gameId: reconnectedGame.gameId,
				color: reconnectedGame.white.userId === userId ? 'w' : 'b',
				opponentName: reconnectedGame.white.userId === userId ? reconnectedGame.black.username : reconnectedGame.white.username,
				fen: reconnectedGame.board.fen(),
				whiteTime: reconnectedGame.whiteTime,
				blackTime: reconnectedGame.blackTime,
				turn: reconnectedGame.board.turn(),
				history: reconnectedGame.board.history(),
				mode: reconnectedGame.mode,
				isPaused: false,
			});
		}
	}

	handleDisconnect(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		console.log(`Game Gateway: User ${userId} disconnected (Socket: ${client.id})`);

		// Trigger grace period
		this.gameService.handleUserDisconnect(userId);
	}

	@SubscribeMessage('find_match')
	async handleFindMatch(client: Socket, payload: { mode: 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2' }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) {
			client.emit('error', { message: 'Unauthorized' });
			return;
		}

		const userId = parseInt(userIdStr as string);
		const user = await this.usersService.findById(userId);
		if (!user) {
			client.emit('error', { message: 'User not found' });
			return;
		}

		const mode = payload?.mode || 'blitz';
		console.log(`Game Gateway: User ${userId} (${user.username}) searching match in mode ${mode}`);
		const matchGame = this.gameService.addToQueue(userId, client.id, user.username, mode);

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

			// Notify White
			const whitePayload = {
				gameId: matchGame.gameId,
				color: 'w',
				opponentName: matchGame.black.username,
				fen: matchGame.board.fen(),
				whiteTime: matchGame.whiteTime,
				blackTime: matchGame.blackTime,
				turn: matchGame.board.turn(),
				history: matchHistory,
				mode: matchGame.mode,
				isPaused: matchGame.disconnectedPlayerIds.size > 0,
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
				fen: matchGame.board.fen(),
				whiteTime: matchGame.whiteTime,
				blackTime: matchGame.blackTime,
				turn: matchGame.board.turn(),
				history: matchHistory,
				mode: matchGame.mode,
				isPaused: matchGame.disconnectedPlayerIds.size > 0,
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
		payload: { gameId: string; from: string; to: string; promotion?: string }
	) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const result = this.gameService.makeMove(
			payload.gameId,
			userId,
			payload.from,
			payload.to,
			payload.promotion
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
			});
		}
	}

	@SubscribeMessage('leave_game')
	handleLeaveGame(client: Socket, payload?: { gameId?: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		if (payload && payload.gameId) {
			this.gameService.resign(payload.gameId, userId);
		} else {
			this.gameService.removeFromQueue(userId);
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
				const opponentSocket = this.server.sockets.get(result.opponentSocketId);
				if (opponentSocket) {
					opponentSocket.emit('draw_offered', { gameId, fromUserId: userId });
					return;
				}
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
				const requesterSocket = this.server.sockets.get(result.requesterSocketId);
				if (requesterSocket) {
					requesterSocket.emit('draw_declined', { gameId });
					return;
				}
			}
			client.to(gameId).emit('draw_declined', { gameId });
		}
	}

	@SubscribeMessage('rematch_request')
	async handleRematchRequest(client: Socket, payload: { gameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const gameId = payload?.gameId;
		if (!gameId) {
			client.emit('error', { message: 'Missing gameId' });
			return;
		}

		// Check if opponent is still connected to the game namespace
		const allSockets = this.server.sockets;
		let opponentConnected = false;
		let opponentSocketId: string | null = null;

		for (const [socketId, socket] of allSockets) {
			const sockUserId = socket.handshake.query.userId;
			if (sockUserId && parseInt(sockUserId as string) !== userId &&
				this.gameService.isPlayerInFinishedGame(gameId, parseInt(sockUserId as string))) {
				opponentConnected = true;
				opponentSocketId = socketId;
				break;
			}
		}

		if (!opponentConnected) {
			client.emit('rematch_declined', { gameId, reason: 'opponent_left' });
			return;
		}

		const rematch = this.gameService.addRematchRequest(gameId, userId);
		if (!rematch) {
			client.emit('error', { message: 'Cannot request rematch' });
			return;
		}

		// Store the auto-decline callback to notify the requester
		const originalTimer = rematch.timer;
		clearTimeout(originalTimer);
		rematch.timer = setTimeout(() => {
			const declined = this.gameService.declineRematch(gameId);
			if (declined) {
				// Notify requester
				for (const [, socket] of this.server.sockets) {
					const uid = socket.handshake.query.userId;
					if (uid && parseInt(uid as string) === declined.requesterId) {
						socket.emit('rematch_declined', { gameId, reason: 'timeout' });
						break;
					}
				}
			}
		}, 30000);

		// Notify opponent
		if (opponentSocketId) {
			const user = await this.usersService.findById(userId);
			const opponentSocket = this.server.sockets.get(opponentSocketId);
			if (opponentSocket) {
				opponentSocket.emit('rematch_received', {
					gameId,
					from: user?.username || 'Unknown',
				});
			}
		}
	}

	@SubscribeMessage('rematch_accept')
	handleRematchAccept(client: Socket, payload: { gameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const gameId = payload?.gameId;
		if (!gameId) return;

		const result = this.gameService.acceptRematch(gameId, userId);
		if (!result) {
			client.emit('error', { message: 'Rematch not found or expired' });
			return;
		}

		const { rematch } = result;

		// Find requester socket
		let requesterSocketId: string | null = null;
		for (const [socketId, socket] of this.server.sockets) {
			const uid = socket.handshake.query.userId;
			if (uid && parseInt(uid as string) === rematch.requesterId) {
				requesterSocketId = socketId;
				break;
			}
		}

		if (!requesterSocketId) {
			client.emit('rematch_declined', { gameId, reason: 'opponent_left' });
			return;
		}

		// Swap colors from the original game
		const whiteUserId = rematch.requesterWasWhite ? rematch.opponentId : rematch.requesterId;
		const blackUserId = rematch.requesterWasWhite ? rematch.requesterId : rematch.opponentId;

		const requesterSocket = this.server.sockets.get(requesterSocketId);
		const accepterSocket = client;

		const whiteSocketId = whiteUserId === rematch.requesterId ? requesterSocketId : accepterSocket.id;
		const blackSocketId = blackUserId === rematch.requesterId ? requesterSocketId : accepterSocket.id;

		// Look up usernames
		const getUsername = async (uid: number) => {
			const user = await this.usersService.findById(uid);
			return user?.username || 'Unknown';
		};

		(async () => {
			const whiteUsername = await getUsername(whiteUserId);
			const blackUsername = await getUsername(blackUserId);

			const newGame = this.gameService.createDirectMatch(
				whiteUserId, whiteSocketId, whiteUsername,
				blackUserId, blackSocketId, blackUsername,
				rematch.mode,
			);

			const roomName = newGame.gameId;
			if (requesterSocket) requesterSocket.join(roomName);
			accepterSocket.join(roomName);

			const matchHistory = newGame.board.history ? newGame.board.history() : [];

			// Notify both players
			const whitePayload = {
				gameId: newGame.gameId,
				color: 'w',
				opponentName: blackUsername,
				fen: newGame.board.fen(),
				whiteTime: newGame.whiteTime,
				blackTime: newGame.blackTime,
				turn: newGame.board.turn(),
				history: matchHistory,
				mode: newGame.mode,
				isPaused: false,
			};
			const blackPayload = {
				gameId: newGame.gameId,
				color: 'b',
				opponentName: whiteUsername,
				fen: newGame.board.fen(),
				whiteTime: newGame.whiteTime,
				blackTime: newGame.blackTime,
				turn: newGame.board.turn(),
				history: matchHistory,
				mode: newGame.mode,
				isPaused: false,
			};

			const whiteSocket = this.server.sockets.get(whiteSocketId);
			const blackSocket = this.server.sockets.get(blackSocketId);

			if (whiteSocket) whiteSocket.emit('match_found', whitePayload);
			if (blackSocket) blackSocket.emit('match_found', blackPayload);
		})();
	}

	@SubscribeMessage('rematch_decline')
	handleRematchDecline(client: Socket, payload: { gameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const gameId = payload?.gameId;
		if (!gameId) return;

		const rematch = this.gameService.declineRematch(gameId);
		if (!rematch) return;

		// Notify requester
		for (const [, socket] of this.server.sockets) {
			const uid = socket.handshake.query.userId;
			if (uid && parseInt(uid as string) === rematch.requesterId) {
				socket.emit('rematch_declined', { gameId, reason: 'declined' });
				break;
			}
		}
	}
}
