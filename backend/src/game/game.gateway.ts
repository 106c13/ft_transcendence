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
}
