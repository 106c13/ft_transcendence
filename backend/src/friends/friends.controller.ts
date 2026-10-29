import {
	Controller,
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
	constructor(private readonly friendsService: FriendsService) { }

	@Get()
	getFriends(@Req() req) {
		return this.friendsService.getFriends(req.user.userId)
	}

	@Get('status/:username')
	async getStatus(
		@Req() req,
		@Param('username') username: string,
	) {
		return this.friendsService.getRequestStatusByUsername(
			req.user.userId,
			username,
		)
	}

	@Get('list/:username')
	async getFriendList(
		@Req() req,
		@Param('username') username: string,
	) {
		return this.friendsService.getFriendList(username);
	}
}
