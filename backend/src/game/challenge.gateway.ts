import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { GameService } from './game.service';
import { UsersService } from '../users/users.service';
import { FriendsService } from '../friends/friends.service';
import { PresenceService } from '@/presence/presence.service';
import type { GameModeType, PendingChallenge } from './game.service';

@WebSocketGateway({
	namespace: '/challenge',
	cors: {
		origin: true,
		credentials: true,
	},
})
export class ChallengeGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Namespace;

	constructor(
		private gameService: GameService,
		private usersService: UsersService,
		private friendsService: FriendsService,
		private presenceService: PresenceService,
	) {}

	async handleConnection(client: Socket): Promise<void> {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		client.join(`user_${userId}`);

		const isFirst = await this.presenceService.handleUserConnect(userId, client.id);
		if (isFirst) {
			const user = await this.usersService.findById(userId);
			if (user) {
				this.server.emit('user_status_changed', {
					userId: user.id,
					username: user.username,
					status: 'ONLINE',
				});
			}
		}
	}

	async handleDisconnect(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		
		const becomeOffline = await this.presenceService.handleUserDisconnect(userId, client.id);
		if (becomeOffline) {
			const user = await this.usersService.findById(userId);
			if (user) {
				this.server.emit('user_status_changed', {
					userId: user.id,
					username: user.username,
					status: 'OFFLINE',
				});
			}
		}
	}

	@SubscribeMessage('send_challenge')
	async handleSendChallenge(client: Socket, payload: { friendUsername: string; mode: GameModeType }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) {
			client.emit('error', { message: 'unauthorized' });
			return;
		}

		const senderId = parseInt(userIdStr as string);
		const sender = await this.usersService.findById(senderId);
		if (!sender) {
			client.emit('error', { message: 'user_not_found' });
			return;
		}

		const { friendUsername, mode } = payload;
		if (!friendUsername || !mode) {
			client.emit('error', { message: 'missing_fields' });
			return;
		}

		const receiver = await this.usersService.findByUsername(friendUsername);
		if (!receiver) {
			client.emit('challenge_error', { message: 'user_not_found' });
			return;
		}

		const friendStatus = await this.friendsService.getRequestStatusByUsername(senderId, friendUsername);
		if (friendStatus.status !== 'ACCEPTED') {
			client.emit('challenge_error', { message: 'can_only_challenge_friends' });
			return;
		}

		if (senderId === receiver.id) {
			client.emit('challenge_error', { message: 'cannot_challenge_yourself' });
			return;
		}

		// Check if receiver is connected to the challenge namespace
		if (!this.presenceService.isUserOnline(receiver.id)) {
			client.emit('challenge_error', { message: 'friend_not_online' });
			return;
		}

		const challengeId = `challenge_${Date.now()}_${senderId}_${receiver.id}`;

		// Create the 30-second auto-decline timer
		const timer = setTimeout(() => {
			const challenge = this.gameService.removeChallenge(challengeId);
			if (challenge) {
				this.server.to(`user_${challenge.senderId}`).emit('challenge_expired', { challengeId });
				this.server.to(`user_${challenge.receiverId}`).emit('challenge_expired', { challengeId });
			}
		}, 30000);

		const challenge: PendingChallenge = {
			challengeId,
			senderId,
			senderUsername: sender.username,
			receiverId: receiver.id,
			receiverUsername: receiver.username,
			mode,
			timer,
		};

		this.gameService.addChallenge(challenge);

		this.server.to(`user_${sender.id}`).emit('challenge_sent', {
			challengeId,
			friendUsername,
			mode,
		});

		this.server.to(`user_${receiver.id}`).emit('challenge_received', {
			challengeId,
			from: sender.username,
			mode,
		});
	}

	@SubscribeMessage('send_rematch')
	async handleSendRematch(client: Socket, payload: { previousGameId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) {
			client.emit('error', { message: 'unauthorized' });
			return;
		}

		const senderId = parseInt(userIdStr as string, 10);
		const previousGameId = payload?.previousGameId;
		if (!previousGameId) {
			client.emit('challenge_error', { message: 'missing_game_id' });
			return;
		}

		const matchId = parseInt(previousGameId, 10);
		if (isNaN(matchId)) {
			client.emit('challenge_error', { message: 'invalid_game_id' });
			return;
		}

		const match = await this.gameService.getMatchById(matchId);
		if (!match) {
			client.emit('challenge_error', { message: 'match_not_found' });
			return;
		}

		const isWhite = match.white_id === senderId;
		const isBlack = match.black_id === senderId;
		if (!isWhite && !isBlack) {
			client.emit('challenge_error', { message: 'not_a_player_in_game' });
			return;
		}

		const receiverId = isWhite ? match.black_id : match.white_id;
		const receiver = await this.usersService.findById(receiverId);
		const sender = await this.usersService.findById(senderId);
		if (!receiver || !sender) {
			client.emit('challenge_error', { message: 'user_not_found' });
			return;
		}

		// Check if receiver is online
		if (!this.presenceService.isUserOnline(receiver.id)) {
			client.emit('challenge_error', { message: 'opponent_not_online' });
			return;
		}

		// Pre-swap colors from previous game
		const whiteUserId = isWhite ? receiver.id : sender.id;
		const blackUserId = isWhite ? sender.id : receiver.id;

		const mode = match.mode as GameModeType;
		const challengeId = `rematch_${Date.now()}_${senderId}_${receiver.id}`;

		const timer = setTimeout(() => {
			const challenge = this.gameService.removeChallenge(challengeId);
			if (challenge) {
				this.server.to(`user_${challenge.senderId}`).emit('challenge_expired', { challengeId, isRematch: true });
				this.server.to(`user_${challenge.receiverId}`).emit('challenge_expired', { challengeId, isRematch: true });
			}
		}, 30000);

		const challenge: PendingChallenge = {
			challengeId,
			senderId,
			senderUsername: sender.username,
			receiverId: receiver.id,
			receiverUsername: receiver.username,
			mode,
			isRematch: true,
			previousGameId,
			whiteUserId,
			blackUserId,
			timer,
		};

		this.gameService.addChallenge(challenge);

		this.server.to(`user_${sender.id}`).emit('challenge_sent', {
			challengeId,
			friendUsername: receiver.username,
			mode,
			isRematch: true,
		});

		this.server.to(`user_${receiver.id}`).emit('challenge_received', {
			challengeId,
			from: sender.username,
			mode,
			isRematch: true,
		});
	}

	@SubscribeMessage('accept_challenge')
	async handleAcceptChallenge(client: Socket, payload: { challengeId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const { challengeId } = payload;

		const challenge = this.gameService.getChallenge(challengeId);
		if (!challenge || challenge.receiverId !== userId) {
			client.emit('error', { message: 'challenge_not_found_or_expired' });
			client.emit('challenge_error', { message: 'challenge_not_found_or_expired' });
			return;
		}

		this.gameService.removeChallenge(challengeId);

		// If the accepting player is in an active game, resign it
		this.gameService.resignActiveGame(userId);

		let whiteId: number;
		let blackId: number;
		let whiteUsername: string;
		let blackUsername: string;

		if (challenge.isRematch && challenge.whiteUserId && challenge.blackUserId) {
			whiteId = challenge.whiteUserId;
			blackId = challenge.blackUserId;
			whiteUsername = whiteId === challenge.senderId ? challenge.senderUsername : challenge.receiverUsername;
			blackUsername = blackId === challenge.senderId ? challenge.senderUsername : challenge.receiverUsername;
		} else {
			const isP1White = Math.random() < 0.5;
			whiteId = isP1White ? challenge.senderId : challenge.receiverId;
			blackId = isP1White ? challenge.receiverId : challenge.senderId;
			whiteUsername = isP1White ? challenge.senderUsername : challenge.receiverUsername;
			blackUsername = isP1White ? challenge.receiverUsername : challenge.senderUsername;
		}

		// Create the game with placeholder socket IDs; players will connect to /game with the challenge gameId
		const newGame = await this.gameService.createDirectMatch(
			whiteId, '', whiteUsername,
			blackId, '', blackUsername,
			challenge.mode,
		);

		const acceptPayload = {
			challengeId,
			gameId: newGame.gameId,
			mode: challenge.mode,
			isRematch: challenge.isRematch,
		};

		this.server.to(`user_${challenge.senderId}`).emit('challenge_accepted', acceptPayload);
		this.server.to(`user_${challenge.receiverId}`).emit('challenge_accepted', acceptPayload);
		client.emit('challenge_accepted', acceptPayload);
	}

	@SubscribeMessage('decline_challenge')
	handleDeclineChallenge(client: Socket, payload: { challengeId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const { challengeId } = payload;

		const challenge = this.gameService.removeChallenge(challengeId);
		if (!challenge) return;

		this.server.to(`user_${challenge.senderId}`).emit('challenge_declined', { challengeId, isRematch: challenge.isRematch });
	}
}
