import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	Req,
	UseGuards,
	Query,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { MessagesService } from './messages.service'

@Controller('messages')
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {}

	@Get(':chat_id')
	@UseGuards(JwtAuthGuard)
	async getMessages(
		@Req() req,
		@Param('chat_id') chatId: string,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string
	) {
		const userId = req.user.userId

		const [id1, id2] = chatId.split('_').map(Number)

		if (userId !== id1 && userId !== id2) {
			throw new BadRequestException('You are not a participant of this chat')
		}

		return this.messagesService.getMessages(chatId, {
			limit: limit ? parseInt(limit) : 50,
			offset: offset ? parseInt(offset) : 0,
		})
	}

	@Post('send')
	@UseGuards(JwtAuthGuard)
	async sendMessage(
		@Req() req,
		@Body() body: { chat_id: string; content: string }
	) {
		const userId = req.user.userId

		if (!body.content || body.content.trim().length === 0) {
			throw new BadRequestException('Message content cannot be empty')
		}

		if (body.content.length > 200) {
			throw new BadRequestException('Message content is too long (max 200 characters)')
		}

		const [id1, id2] = body.chat_id.split('_').map(Number)

		if (userId !== id1 && userId !== id2) {
			throw new BadRequestException('You are not a participant of this chat')
		}

		return this.messagesService.sendMessage(
			body.chat_id,
			userId,
			body.content.trim()
		)
	}

	@Delete(':message_id')
	@UseGuards(JwtAuthGuard)
	async deleteMessage(
		@Req() req,
		@Param('message_id') messageId: string
	) {
		const userId = req.user.userId
		return this.messagesService.deleteMessage(parseInt(messageId), userId)
	}
}
