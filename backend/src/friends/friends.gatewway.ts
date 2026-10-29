import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { FriendsService } from '../friends/friends.service';
import { UsersService } from '../users/users.service';
import { FriendRequest, FriendRequestStatus } from '../friends/friend-request.entity';
import { Friendship } from '../friends/friendship.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from '../notification/notification.entity';

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

    constructor(
        private friendsService: FriendsService,
        private usersService: UsersService,

        @InjectRepository(FriendRequest)
        private friendRequestRepo: Repository<FriendRequest>,

        @InjectRepository(Friendship)
        private friendshipRepo: Repository<Friendship>,

        @InjectRepository(Notification)
        private notificationRepo: Repository<Notification>,
    ) {}

    async handleConnection(client: Socket): Promise<void> {
        const userIdStr = client.handshake.query.userId;
        if (!userIdStr) return;

        const userId = parseInt(userIdStr as string);
        client.join(`user_${userId}`);
    }

    async handleDisconnect(client: Socket) {
        const userIdStr = client.handshake.query.userId;
        if (!userIdStr) return;

        const userId = parseInt(userIdStr as string);
        client.leave(`user_${userId}`);
    }

    @SubscribeMessage('send_friend_request')
    async handleSendFriendRequest(client: Socket, payload: { friendUsername: string }) {
        const userIdStr = client.handshake.query.userId;
        if (!userIdStr) return;

        const userId = parseInt(userIdStr as string);
        const sender = await this.usersService.findById(userId);
        if (!sender) {
            client.emit('friend_request_error', { message: 'sender_not_found' });
            return;
        }

        const receiver = await this.usersService.findByUsername(payload.friendUsername);
        if (!receiver) {
            client.emit('friend_request_error', { message: 'user_not_found' });
            return;
        }

        const existingRequest = await this.friendsService.getRequestStatus(userId, receiver.id);
        if (existingRequest) {
            client.emit('friend_request_error', { message: 'request_already_exists' });
            return;
        }

        const request = await this.friendRequestRepo.create({
            sender,
            receiver,
            status: FriendRequestStatus.PENDING,
        });
        await this.friendRequestRepo.save(request);

        const notification = this.notificationRepo.create({
			user_id: receiver.id,
			message: JSON.stringify({ key: 'notification_friend_request', username: sender.username }),
			link: `/profile/${sender.username}`,
			is_read: false,
		});
		await this.notificationRepo.save(notification);
        this.server.to(`user_${receiver.id}`).emit('friend_request_received', { senderUsername: sender.username });
        this.server.to(`user_${sender.id}`).emit('friend_request_sent', { receiverUsername: receiver.username });
    }

    @SubscribeMessage('accept_friend_request')
    async handleAcceptFriendRequest(client: Socket, payload: { friendUsername: string }) {
        const userIdStr = client.handshake.query.userId;
        if (!userIdStr) return;

        const userId = parseInt(userIdStr as string);
        const sender = await this.usersService.findByUsername(payload.friendUsername);
        if (!sender) {
            client.emit('friend_request_error', { message: 'sender_not_found' });
            return;
        }

        const receiver = await this.usersService.findById(userId);
        if (!receiver) {
            client.emit('friend_request_error', { message: 'user_not_found' });
            return;
        }

        const request = await this.friendRequestRepo.findOne({
            where: {
                sender: { id: sender.id },
                receiver: { id: receiver.id },
                status: FriendRequestStatus.PENDING,
            },
        });

        if (!request) {
            client.emit('friend_request_error', { message: 'request_not_found' });
            return;
        }

        const id1 = Math.min(request.sender.id, request.receiver.id)
		const id2 = Math.max(request.sender.id, request.receiver.id)

		const existing = await this.friendshipRepo.findOne({
			where: {
				user1: { id: id1 },
				user2: { id: id2 },
			},
		})

        if (existing) {
            client.emit('friend_request_error', { message: 'friendship_already_exists' });
            return;
        }

        await this.notificationRepo.delete({
			user_id: userId,
			link: `/profile/${sender.username}`,
		})

        const acceptedNotification = this.notificationRepo.create({
			user_id: sender.id,
			message: JSON.stringify({ key: 'notification_friend_accepted', username: request.receiver.username }),
			link: `/profile/${request.receiver.username}`,
			is_read: false,
		})

        await this.notificationRepo.save(acceptedNotification)
		await this.friendRequestRepo.remove(request)

        this.server.to(`user_${sender.id}`).emit('friend_request_accepted', { receiverUsername: receiver.username });
        this.server.to(`user_${receiver.id}`).emit('friend_request_accepted', { senderUsername: sender.username });
    }

    async handleRejectFriendRequest(client: Socket, payload: { friendUsername: string }) {
        const userIdStr = client.handshake.query.userId;
        if (!userIdStr) return;

        const userId = parseInt(userIdStr as string);
        const sender = await this.usersService.findByUsername(payload.friendUsername);
        if (!sender) {
            client.emit('friend_request_error', { message: 'sender_not_found' });
            return;
        }

        const receiver = await this.usersService.findById(userId);
        if (!receiver) {
            client.emit('friend_request_error', { message: 'user_not_found' });
            return;
        }

        const request = await this.friendRequestRepo.findOne({
            where: {
                sender: { id: sender.id },
                receiver: { id: receiver.id },
                status: FriendRequestStatus.PENDING,
            },
        });

        if (!request) {
            client.emit('friend_request_error', { message: 'request_not_found' });
            return;
        }

        await this.notificationRepo.delete({
            user_id: userId,
            link: `/profile/${sender.username}`,
        })

        await this.friendRequestRepo.remove(request)

        this.server.to(`user_${sender.id}`).emit('friend_request_rejected', { receiverUsername: receiver.username });
        this.server.to(`user_${receiver.id}`).emit('friend_request_rejected', { senderUsername: sender.username });
    }

    @SubscribeMessage('unfriend')
    async handleUnfriend(client: Socket, payload: { friendUsername: string }) {
        const userIdStr = client.handshake.query.userId;
        if (!userIdStr) return;

        const userId = parseInt(userIdStr as string);
        const friend = await this.usersService.findByUsername(payload.friendUsername);
        if (!friend) {
            client.emit('unfriend_error', { message: 'friend_not_found' });
            return;
        }

        const friendship = await this.friendshipRepo.findOne({
            where: [
                { user1: { id: userId }, user2: { id: friend.id } },
                { user1: { id: friend.id }, user2: { id: userId } },
            ],
        });

        if (!friendship) {
            client.emit('unfriend_error', { message: 'friendship_not_found' });
            return;
        }

        await this.friendshipRepo.remove(friendship);

        this.server.to(`user_${userId}`).emit('unfriended', { friendUsername: friend.username });
        this.server.to(`user_${friend.id}`).emit('unfriended', { friendUsername: (await this.usersService.findById(userId))?.username });
    }
}