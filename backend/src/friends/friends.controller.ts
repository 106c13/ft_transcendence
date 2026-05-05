import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
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
	
	@Post('request/:username')
	sendRequest(
		@Req() req,
		@Param('username') username: string,
	) {
		return this.friendsService.sendRequest(
			req.user.userId,
			username,
		)
	}

	@Patch('accept/:username')
	accept(
		@Req() req,
		@Param('username') username: string,
	) {
		return this.friendsService.acceptRequest(
			req.user.userId,
			username,
		)
	}

	@Delete('reject/:username')
	reject(
		@Req() req,
		@Param('username') username: string,
	) {
		return this.friendsService.rejectRequest(
			req.user.userId,
			username,
		)
	}

	@Delete('cancel/:username')
	@UseGuards(JwtAuthGuard)
	cancel(@Req() req, @Param('username') username: string) {
		return this.friendsService.cancelRequest(
			req.user.userId,
			username,
		)
	}

	@Delete('unfriend/:username')
	@UseGuards(JwtAuthGuard)
	unfriend(@Req() req, @Param('username') username: string) {
		return this.friendsService.unfriend(
			req.user.userId,
			username,
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
