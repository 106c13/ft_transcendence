import {
	Controller,
	Post,
	Patch,
	Get,
	Param,
	Req,
	UseGuards,
} from '@nestjs/common'

import { FriendsService } from './friends.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
	constructor(private readonly friendsService: FriendsService) {}
	
	@Post('request/:id')
	sendRequest(@Req() req, @Param('id') receiverId: string) {
		return this.friendsService.sendRequest(
			req.user.userId,
			Number(receiverId),
		)
	}

	@Patch('accept/:id')
	accept(@Req() req, @Param('id') requestId: string) {
		return this.friendsService.acceptRequest(
			Number(requestId),
			req.user.userId,
		)
	}

	@Patch('reject/:id')
	reject(@Req() req, @Param('id') requestId: string) {
		return this.friendsService.rejectRequest(
			Number(requestId),
			req.user.userId,
		)
	}

	@Get()
	getFriends(@Req() req) {
		return this.friendsService.getFriends(req.user.userId)
	}

	@Get('status/:username')
	@UseGuards(JwtAuthGuard)
	async getStatus(
		@Req() req,
		@Param('username') username: string,
	) {
		return this.friendsService.getRequestStatusByUsername(
			req.user.userId,
			username,
		)
	}
}
