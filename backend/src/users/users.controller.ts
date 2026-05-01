import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	getMe(@Req() req) {
		return this.usersService.findById(req.user.userId)
	}

	@Patch('me')
	@UseGuards(JwtAuthGuard)
	updateMe(
		@Req() req,
		@Body() body: { username?: string; email?: string; bio?: string },
	) {
		return this.usersService.updateUser(req.user.userId, body)
	}

	@Patch('password')
	@UseGuards(JwtAuthGuard)
	async changePassword(
		@Req() req,
		@Body() body: { oldPassword: string; newPassword: string }
	) {
		return this.usersService.changePassword(req.user.userId, body)
	}
}
