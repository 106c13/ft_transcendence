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

	private formatChat(chat: any) {
		return {
			id: chat.id,
			chat_id: chat.chat_id,
			user1_id: chat.user1_id,
			user2_id: chat.user2_id,
			created_at: chat.created_at,
			user1: chat.user1 ? {
				id: chat.user1.id,
				username: chat.user1.username,
				avatar: chat.user1.avatar,
			} : null,
			user2: chat.user2 ? {
				id: chat.user2.id,
				username: chat.user2.username,
				avatar: chat.user2.avatar,
			} : null,
		}
	}

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
			return this.formatChat(chat)
		}
		
		const otherUser = await this.usersService.findById(otherUserId)
		if (!otherUser) {
			throw new NotFoundException('User not found')
		}
		
		let newChat = await this.chatService.createChat(currentUserId, otherUserId)
		
		if (!newChat) {
			throw new NotFoundException('Cant create new chat')
		}
			
		return this.formatChat(newChat)
	}

	@Get('my-chats')
	@UseGuards(JwtAuthGuard)
	async getUserChats(@Req() req) {
		const userId = req.user.userId
		const chats = await this.chatService.getUserChats(userId)
		return chats
	}
}
