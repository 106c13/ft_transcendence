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

	@Get('get/:user_id')
	@UseGuards(JwtAuthGuard)
	async getChat(
		@Req() req,
		@Param('user_id') userIdParam: string
	) {
		const currentUserId = req.user.userId
		const otherUserId = parseInt(userIdParam)
		
		if (isNaN(otherUserId)) {
			throw new BadRequestException('Invalid user ID')
		}
		
		if (currentUserId === otherUserId) {
			throw new BadRequestException('Cannot create chat with yourself')
		}
		
		const id1 = Math.min(currentUserId, otherUserId)
		const id2 = Math.max(currentUserId, otherUserId)
		const chatId = `${id1}_${id2}`
		
		let chat = await this.chatService.getChat(chatId)
		
		if (chat) {
			return {
				chat_id: chat.chat_id,
				user1_id: chat.user1_id,
				user2_id: chat.user2_id,
				created_at: chat.created_at
			}
		}
		
		const otherUser = await this.usersService.findById(otherUserId)
		if (!otherUser) {
			throw new NotFoundException('User not found')
		}
		
		let newChat = await this.chatService.createChat(id1, id2)
		
		if (!newChat) {
			throw new NotFoundException('Cant create new chat')
		}
			
		return {
			chat_id: newChat.chat_id,
			user1_id: newChat.user1_id,
			user2_id: newChat.user2_id,
			created_at: newChat.created_at
		}
			
	}

	@Get('my-chats')
	@UseGuards(JwtAuthGuard)
	async getUserChats(@Req() req) {
		const userId = req.user.userId
		const chats = await this.chatService.getUserChats(userId)
		return chats
	}
}
