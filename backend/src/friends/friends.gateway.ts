import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { FriendsService } from './friends.service';

@WebSocketGateway({
	namespace: '/friends',
	cors: {
		origin: true,
		credentials: true,
	},
})
export class FriendsGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Namespace;

	constructor(private readonly friendsService: FriendsService) {}

	private getUserIdFromClient(client: Socket): number | null {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return null;

		const userId = parseInt(userIdStr as string, 10);
		return isNaN(userId) ? null : userId;
	}

	private emitProfileFriendsUpdated(...usernames: (string | undefined)[]): void {
		for (const username of usernames) {
			if (username) {
				this.server
					.to(`profile_${username.toLowerCase()}`)
					.emit('profile_friends_updated', { username });
			}
		}
	}

	async handleConnection(client: Socket): Promise<void> {
		const userId = this.getUserIdFromClient(client);
		if (userId === null) return;

		client.join(`user_${userId}`);
	}

	async handleDisconnect(client: Socket): Promise<void> {
		const userId = this.getUserIdFromClient(client);
		if (userId === null) return;

		client.leave(`user_${userId}`);
	}

	@SubscribeMessage('view_profile')
	handleViewProfile(client: Socket, payload: { username: string }) {
		if (!payload?.username) return;
		client.join(`profile_${payload.username.toLowerCase()}`);
	}

	@SubscribeMessage('leave_profile')
	handleLeaveProfile(client: Socket, payload: { username: string }) {
		if (!payload?.username) return;
		client.leave(`profile_${payload.username.toLowerCase()}`);
	}

	@SubscribeMessage('send_friend_request')
	async handleSendFriendRequest(client: Socket, payload: { friendUsername: string }) {
		const userId = this.getUserIdFromClient(client);
		if (userId === null) return;

		try {
			const { sender, receiver, notification } = await this.friendsService.sendRequest(
				userId,
				payload.friendUsername,
			);

			this.server.to(`user_${receiver.id}`).emit('friend_request_received', {
				senderUsername: sender.username,
			});
			this.server.to(`user_${sender.id}`).emit('friend_request_sent', {
				receiverUsername: receiver.username,
			});

			this.emitProfileFriendsUpdated(sender.username, receiver.username);

			this.server.to(`user_${receiver.id}`).emit('new_notification', notification);
		} catch (err) {
			client.emit('friend_request_error', {
				message: err instanceof Error ? err.message : 'unknown_error',
			});
		}
	}

	@SubscribeMessage('accept_friend_request')
	async handleAcceptFriendRequest(client: Socket, payload: { friendUsername: string }) {
		const userId = this.getUserIdFromClient(client);
		if (userId === null) return;

		try {
			const { sender, receiver, acceptedNotification } = await this.friendsService.acceptRequest(
				userId,
				payload.friendUsername,
			);

			this.server.to(`user_${sender.id}`).emit('friend_request_accepted', {
				receiverUsername: receiver.username,
			});
			this.server.to(`user_${receiver.id}`).emit('friend_request_accepted', {
				senderUsername: sender.username,
			});

			this.emitProfileFriendsUpdated(sender.username, receiver.username);

			this.server.to(`user_${userId}`).emit('notification_deleted', {
				link: `/profile/${sender.username}`,
			});
			this.server.to(`user_${sender.id}`).emit('new_notification', acceptedNotification);
		} catch (err) {
			client.emit('friend_request_error', {
				message: err instanceof Error ? err.message : 'unknown_error',
			});
		}
	}

	@SubscribeMessage('reject_friend_request')
	async handleRejectFriendRequest(client: Socket, payload: { friendUsername: string }) {
		const userId = this.getUserIdFromClient(client);
		if (userId === null) return;

		try {
			const { sender, receiver } = await this.friendsService.rejectRequest(
				userId,
				payload.friendUsername,
			);

			this.server.to(`user_${sender.id}`).emit('friend_request_rejected', {
				receiverUsername: receiver.username,
			});
			this.server.to(`user_${receiver.id}`).emit('friend_request_rejected', {
				senderUsername: sender.username,
			});

			this.emitProfileFriendsUpdated(sender.username, receiver.username);

			this.server.to(`user_${userId}`).emit('notification_deleted', {
				link: `/profile/${sender.username}`,
			});
		} catch (err) {
			client.emit('friend_request_error', {
				message: err instanceof Error ? err.message : 'unknown_error',
			});
		}
	}

	@SubscribeMessage('unfriend')
	async handleUnfriend(client: Socket, payload: { friendUsername: string }) {
		const userId = this.getUserIdFromClient(client);
		if (userId === null) return;

		try {
			const { currentUser, friend } = await this.friendsService.unfriend(
				userId,
				payload.friendUsername,
			);

			this.server.to(`user_${userId}`).emit('unfriended', {
				friendUsername: friend.username,
			});
			this.server.to(`user_${friend.id}`).emit('unfriended', {
				friendUsername: currentUser?.username,
			});

			this.emitProfileFriendsUpdated(currentUser?.username, friend.username);
		} catch (err) {
			client.emit('unfriend_error', {
				message: err instanceof Error ? err.message : 'unknown_error',
			});
		}
	}

	@SubscribeMessage('cancel_friend_request')
	async handleCancelFriendRequest(client: Socket, payload: { friendUsername: string }) {
		const userId = this.getUserIdFromClient(client);
		if (userId === null) return;

		try {
			const { sender, receiver } = await this.friendsService.cancelRequest(
				userId,
				payload.friendUsername,
			);

			this.server.to(`user_${sender.id}`).emit('friend_request_cancelled', {
				receiverUsername: receiver.username,
			});
			this.server.to(`user_${receiver.id}`).emit('friend_request_cancelled', {
				senderUsername: sender.username,
			});

			this.emitProfileFriendsUpdated(sender.username, receiver.username);

			this.server.to(`user_${receiver.id}`).emit('notification_deleted', {
				link: `/profile/${sender.username}`,
			});
		} catch (err) {
			client.emit('friend_request_error', {
				message: err instanceof Error ? err.message : 'unknown_error',
			});
		}
	}
}
