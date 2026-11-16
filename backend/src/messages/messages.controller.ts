import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Req,
	UseGuards,
	Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {}

	@Get('unread/total')
	async getUnreadCount(@Req() req) {
		const count = await this.messagesService.getUnreadCount(req.user.userId);
		return { count };
	}

	@Patch('read/:chat_id')
	async markChatAsRead(
		@Req() req,
		@Param('chat_id') chatId: string,
	) {
		return this.messagesService.markChatAsRead(chatId, req.user.userId);
	}

	@Get(':chat_id')
	async getMessages(
		@Req() req,
		@Param('chat_id') chatId: string,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string,
	) {
		return this.messagesService.getMessages(chatId, req.user.userId, {
			limit: limit ? parseInt(limit, 10) : 50,
			offset: offset ? parseInt(offset, 10) : 0,
		});
	}

	@Post('send')
	async sendMessage(
		@Req() req,
		@Body() body: { chat_id: string; content: string },
	) {
		return this.messagesService.sendMessage(
			body.chat_id,
			req.user.userId,
			body.content,
		);
	}

	@Delete(':message_id')
	async deleteMessage(
		@Req() req,
		@Param('message_id') messageId: string,
	) {
		return this.messagesService.deleteMessage(
			parseInt(messageId, 10),
			req.user.userId,
		);
	}
}
