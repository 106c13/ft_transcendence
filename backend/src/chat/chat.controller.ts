// chat.controller.ts
import {
	Controller,
	Get,
	Body,
	Param,
	Req,
	UseGuards,
	Query,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ChatService } from './chat.service'
import { UsersService } from '../users/users.service'
import { MessagesService } from '../messages/messages.service'

@Controller('chat')
export class ChatController {
	constructor(
		private readonly usersService: UsersService,
		private readonly chatService: ChatService,
		private readonly messagesService: MessagesService,
	) {}

	@Get('get/:chat_id')
	@UseGuards(JwtAuthGuard)
	async getChat(
		@Req() req,
		@Param('chat_id') chatId: string
	) {
		const userId = req.user.userId
		
		const [id1, id2] = chatId.split('_').map(Number)

		if (userId !== id1 && userId !== id2) {
			throw new BadRequestException('You are not a participant of this chat')
		}

		let chat = await this.chatService.getChat(chatId)

		if (chat) {
			return chat;
		}
		
		const user1 = await this.usersService.findById(id1)
		const user2 = await this.usersService.findById(id2)
		
		if (!user1 || !user2) {
			throw new NotFoundException('User not found')
		}
	
		let newChat = await this.chatService.createChat(id1, id2)
		
		return newChat
	}

	@Get('my-chats')
	@UseGuards(JwtAuthGuard)
	async getUserChats(@Req() req) {
		const userId = req.user.userId
		const chats = await this.chatService.getUserChats(userId)
		
		const enrichedChats = await Promise.all(
			chats.map(async (chat) => {
				const lastMessage = await this.messagesService.getLastMessage(chat.chat_id)
				
				return {
					...chat,
					lastMessage,
				}
			})
		)
		
		return enrichedChats
	}
}
