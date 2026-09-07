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
import { FriendsService } from '../friends/friends.service';
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

	// Track connected users: userId -> socketId
	private connectedUsers = new Map<number, string>();

	constructor(
		private gameService: GameService,
		private usersService: UsersService,
		private friendsService: FriendsService,
	) {}

	handleConnection(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		this.connectedUsers.set(userId, client.id);
		console.log(`Challenge Gateway: User ${userId} connected (Socket: ${client.id})`);
	}

	handleDisconnect(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string);
		// Only delete if it's the current socket (user might have reconnected with a new one)
		if (this.connectedUsers.get(userId) === client.id) {
			this.connectedUsers.delete(userId);
		}
		console.log(`Challenge Gateway: User ${userId} disconnected (Socket: ${client.id})`);
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

		// Look up the friend
		const receiver = await this.usersService.findByUsername(friendUsername);
		if (!receiver) {
			client.emit('challenge_error', { message: 'User not found' });
			return;
		}

		// Verify they are friends
		const friendStatus = await this.friendsService.getRequestStatusByUsername(senderId, friendUsername);
		if (friendStatus.status !== 'ACCEPTED') {
			client.emit('challenge_error', { message: 'You can only challenge friends' });
			return;
		}

		// Can't challenge yourself
		if (senderId === receiver.id) {
			client.emit('challenge_error', { message: 'Cannot challenge yourself' });
			return;
		}

		// Check if receiver is connected to the challenge namespace
		const receiverSocketId = this.connectedUsers.get(receiver.id);
		if (!receiverSocketId) {
			client.emit('challenge_error', { message: 'Friend is not online' });
			return;
		}

		const challengeId = `challenge_${Date.now()}_${senderId}_${receiver.id}`;

		// Create the 30-second auto-decline timer
		const timer = setTimeout(() => {
			const challenge = this.gameService.removeChallenge(challengeId);
			if (challenge) {
				// Notify sender
				const senderSockId = this.connectedUsers.get(challenge.senderId);
				if (senderSockId) {
					const senderSocket = this.server.sockets.get(senderSockId);
					if (senderSocket) {
						senderSocket.emit('challenge_expired', { challengeId });
					}
				}
				// Notify receiver
				const receiverSockId = this.connectedUsers.get(challenge.receiverId);
				if (receiverSockId) {
					const receiverSocket = this.server.sockets.get(receiverSockId);
					if (receiverSocket) {
						receiverSocket.emit('challenge_expired', { challengeId });
					}
				}
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

		// Notify the sender that challenge was sent
		client.emit('challenge_sent', {
			challengeId,
			friendUsername,
			mode,
		});

		// Notify the receiver
		const receiverSocket = this.server.sockets.get(receiverSocketId);
		if (receiverSocket) {
			receiverSocket.emit('challenge_received', {
				challengeId,
				from: sender.username,
				mode,
			});
		}
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

		// Remove the challenge (clears the timer)
		this.gameService.removeChallenge(challengeId);

		// If the accepting player is in an active game, resign it
		this.gameService.resignActiveGame(userId);

		// Randomize colors
		const isP1White = Math.random() < 0.5;
		const whiteId = isP1White ? challenge.senderId : challenge.receiverId;
		const blackId = isP1White ? challenge.receiverId : challenge.senderId;
		const whiteUsername = isP1White ? challenge.senderUsername : challenge.receiverUsername;
		const blackUsername = isP1White ? challenge.receiverUsername : challenge.senderUsername;

		// We need game socket IDs, but these players might not be on /game yet.
		// Create the game with placeholder socket IDs; the players will connect to /game with the challenge gameId.
		const newGame = this.gameService.createDirectMatch(
			whiteId, '', whiteUsername,
			blackId, '', blackUsername,
			challenge.mode,
		);

		// Notify both players via the challenge namespace to navigate to the game
		const senderSocketId = this.connectedUsers.get(challenge.senderId);
		if (senderSocketId) {
			const senderSocket = this.server.sockets.get(senderSocketId);
			if (senderSocket) {
				senderSocket.emit('challenge_accepted', {
					challengeId,
					gameId: newGame.gameId,
					mode: challenge.mode,
				});
			}
		}

		client.emit('challenge_accepted', {
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

		// Notify the sender
		const senderSocketId = this.connectedUsers.get(challenge.senderId);
		if (senderSocketId) {
			const senderSocket = this.server.sockets.get(senderSocketId);
			if (senderSocket) {
				senderSocket.emit('challenge_declined', { challengeId });
			}
		}
	}
}
