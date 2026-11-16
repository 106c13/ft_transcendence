// backend/src/chat/chat.gateway.ts
import {
	WebSocketGateway,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';

@WebSocketGateway({
	namespace: '/chat',
	cors: {
		origin: true,
		credentials: true,
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Namespace;

	handleConnection(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string, 10);
		if (!isNaN(userId)) {
			client.join(`user_${userId}`);
		}
	}

	handleDisconnect(client: Socket) {
		const userIdStr = client.handshake.query.userId;
		if (!userIdStr) return;

		const userId = parseInt(userIdStr as string, 10);
		if (!isNaN(userId)) {
			client.leave(`user_${userId}`);
		}
	}

	emitNewMessage(user1Id: number, user2Id: number, message: unknown) {
		this.server
			.to(`user_${user1Id}`)
			.to(`user_${user2Id}`)
			.emit('new_message', {
				type: 'new_message',
				message,
			});
	}

	emitMessagesRead(userId: number, chatId: string, unreadCount: number) {
		this.server
			.to(`user_${userId}`)
			.emit('messages_read', {
				chat_id: chatId,
				reader_id: userId,
				unread_count: unreadCount,
			});
	}
}
