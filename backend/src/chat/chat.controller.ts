import {
	Controller,
	Get,
	Param,
	Req,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get('get/:user_id')
	async getChat(
		@Req() req,
		@Param('user_id') userIdParam: string,
	) {
		return this.chatService.getOrCreateChat(
			req.user.userId,
			parseInt(userIdParam, 10),
		);
	}

	@Get('my-chats')
	async getUserChats(@Req() req) {
		return this.chatService.getUserChats(req.user.userId);
	}
}
