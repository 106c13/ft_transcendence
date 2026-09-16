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
			client.emit('error', { message: 'Unauthorized' });
			return;
		}

		const senderId = parseInt(userIdStr as string);
		const sender = await this.usersService.findById(senderId);
		if (!sender) {
			client.emit('error', { message: 'User not found' });
			return;
		}

		const { friendUsername, mode } = payload;
		if (!friendUsername || !mode) {
			client.emit('error', { message: 'Missing fields' });
			return;
		}

		const receiver = await this.usersService.findByUsername(friendUsername);
		if (!receiver) {
			client.emit('challenge_error', { message: 'User not found' });
			return;
		}

		const friendStatus = await this.friendsService.getRequestStatusByUsername(senderId, friendUsername);
		if (friendStatus.status !== 'ACCEPTED') {
			client.emit('challenge_error', { message: 'You can only challenge friends' });
			return;
		}

		if (senderId === receiver.id) {
			client.emit('challenge_error', { message: 'Cannot challenge yourself' });
			return;
		}

		// Check if receiver is connected to the challenge namespace
		if (!this.presenceService.isUserOnline(receiver.id)) {
			client.emit('challenge_error', { message: 'Friend is not online' });
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

	@SubscribeMessage('accept_challenge')
	async handleAcceptChallenge(client: Socket, payload: { challengeId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		const { challengeId } = payload;

		const challenge = this.gameService.getChallenge(challengeId);
		if (!challenge || challenge.receiverId !== userId) {
			client.emit('error', { message: 'Challenge not found or expired' });
			return;
		}

		this.gameService.removeChallenge(challengeId);

		// If the accepting player is in an active game, resign it
		this.gameService.resignActiveGame(userId);

		const isP1White = Math.random() < 0.5;
		const whiteId = isP1White ? challenge.senderId : challenge.receiverId;
		const blackId = isP1White ? challenge.receiverId : challenge.senderId;
		const whiteUsername = isP1White ? challenge.senderUsername : challenge.receiverUsername;
		const blackUsername = isP1White ? challenge.receiverUsername : challenge.senderUsername;

		// We need game socket IDs, but these players might not be on /game yet.
		// Create the game with placeholder socket IDs; the players will connect to /game with the challenge gameId.
		const newGame = await this.gameService.createDirectMatch(
			whiteId, '', whiteUsername,
			blackId, '', blackUsername,
			challenge.mode,
		);

		
		this.server.to(`user_${challenge.senderId}`).emit('challenge_accepted', {
			challengeId,
			gameId: newGame.gameId,
			mode: challenge.mode,
		});

		this.server.to(`user_${challenge.receiverId}`).emit('challenge_accepted', {
			challengeId,
			gameId: newGame.gameId,
			mode: challenge.mode,
		});
	}

	@SubscribeMessage('decline_challenge')
	handleDeclineChallenge(client: Socket, payload: { challengeId: string }) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const { challengeId } = payload;

		const challenge = this.gameService.removeChallenge(challengeId);
		if (!challenge) return;

		this.server.to(`user_${challenge.senderId}`).emit('challenge_declined', { challengeId });
	}
}
