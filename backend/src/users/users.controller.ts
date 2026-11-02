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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	async getMe(@Req() req) {
		return this.usersService.getMe(req.headers.authorization);
	}

	@Get('search')
	@UseGuards(JwtAuthGuard)
	async searchUser(@Query('q') query: string) {
		return this.usersService.searchUser(query);
	}

	@Get(':username')
	async getByUsername(@Req() req, @Param('username') username: string) {
		return this.usersService.getProfileByUsername(username, req.headers.authorization);
	}

	@Patch('me')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(
		FileInterceptor('file', {
			storage: diskStorage({
				destination: './uploads',
				filename: (req, file, cb) => {
					const uniqueName =
						Date.now() + '-' + Math.round(Math.random() * 1e9);

					cb(null, uniqueName + extname(file.originalname));
				},
			}),
		}),
	)
	async updateMe(
		@Req() req,
		@UploadedFile() file: Express.Multer.File,
		@Body() body: any,
	) {
		return this.usersService.updateUser(req.user.userId, body, file?.filename);
	}

	@Patch('password')
	@UseGuards(JwtAuthGuard)
	async changePassword(
		@Req() req,
		@Body() body: { oldPassword: string; newPassword: string }
	) {
		await this.usersService.changePassword(req.user.userId, body);

		return { succes: true };
	}
}
