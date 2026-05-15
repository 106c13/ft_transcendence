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
	Query,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { diskStorage } from 'multer'
import { extname } from 'path'
import type { Express } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'

function isValidEmail(email: string) {
	return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 256)
}

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	async getMe(@Req() req) {
		const user = await this.usersService.findById(req.user.userId)

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return {
			username: user.username,
			bio: user.bio,
			is_active: user.is_active,
			last_seen: user.last_seen,
			created_at: user.created_at,
		}
	}

	@Get('search')
	@UseGuards(JwtAuthGuard)
	async searchUser(
		@Req() req,
		@Query('q') query: string
	) {
		return this.usersService.searchUser(query)
	}

	@Get(':username')
	async getByUsername(@Param('username') username: string) {
		const user = await this.usersService.findByUsername(username)

		if (!user) {
			throw new NotFoundException('User not found')
		}

		return {
			username: user.username,
			bio: user.bio,
			is_active: user.is_active,
			last_seen: user.last_seen,
			created_at: user.created_at,
		}
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

		if (/[^a-zA-Z0-9]/.test(body.username)) {
			throw new BadRequestException('Username should contain only letters and numbers');
		}

		if (body.username.length > 15) {
			throw new BadRequestException('Username should be less than 15 characters');
		}

		if (body.bio.length > 100) {
			throw new BadRequestException('Bio should be less than 100 characters');
		}

		if (body.email && !isValidEmail(body.email)) {
			throw new BadRequestException('Invalid email format');
		}


		const updateData: any = {
			username: body.username,
			email: body.email,
			bio: body.bio,
		}

		if (file) {
			updateData.avatar = file.filename
		}

		await this.usersService.updateUser(userId, updateData)
		
		return { success: true }
	}

	@Patch('password')
	@UseGuards(JwtAuthGuard)
	async changePassword(
		@Req() req,
		@Body() body: { oldPassword: string; newPassword: string }
	) {
		await this.usersService.changePassword(req.user.userId, body)

		return { succes: true }
	}

}
