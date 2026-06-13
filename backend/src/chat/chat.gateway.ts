// backend/src/chat/chat.gateway.ts
import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
	cors: {
		origin: 'http://localhost:8080',
		credentials: true,
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server

	private userSockets = new Map<number, string>()

	handleConnection(client: Socket) {
		const userId = client.handshake.query.userId
		if (userId) {
			this.userSockets.set(parseInt(userId as string), client.id)
			console.log(`User ${userId} connected`)
		}
	}

	handleDisconnect(client: Socket) {
		for (const [userId, socketId] of this.userSockets.entries()) {
			if (socketId === client.id) {
				this.userSockets.delete(userId)
				console.log(`User ${userId} disconnected`)
				break
			}
		}
	}

	@SubscribeMessage('send_message')
	handleMessage(client: Socket, payload: { receiver_id: number; chat_id: string; message: any }) {
		const receiverSocketId = this.userSockets.get(payload.receiver_id)
	}
}
