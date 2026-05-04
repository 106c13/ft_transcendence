import {
	Controller,
	Get,
	Patch,
	Body,
	Req,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	Param,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import type { Express } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	getMe(@Req() req) {
		return this.usersService.findById(req.user.userId)
	}

	@Get(':username')
	getByUsername(@Param('username') username: string) {
		return this.usersService.findByUsername(username)
	}

	@Patch('me')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(
		FileInterceptor('file', {
			storage: diskStorage({
				destination: './uploads',
				filename: (req, file, cb) => {
					const uniqueName =
						Date.now() + '-' + Math.round(Math.random() * 1e9)

					cb(null, uniqueName + extname(file.originalname))
				},
			}),
		}),
	)
	async updateMe(
		@Req() req,
		@UploadedFile() file: Express.Multer.File,
		@Body() body: any,
	) {
		const userId = req.user.userId

		const updateData: any = {
			username: body.username,
			email: body.email,
			bio: body.bio,
		}

		if (file) {
			updateData.avatar = file.filename
		}

		return this.usersService.updateUser(userId, updateData)
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
