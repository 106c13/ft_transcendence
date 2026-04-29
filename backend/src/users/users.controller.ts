import { Controller, Get, Headers } from '@nestjs/common';
import { UsersService } from './users.service';
import * as jwt from 'jsonwebtoken';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	async getMe(@Headers('authorization') auth: string) {
		const token = auth?.replace('Bearer ', '');

		if (!token) {
			return { message: 'No token provided' };
		}

		const decoded = jwt.decode(token) as any;

		if (!decoded?.sub) {
			return { message: 'Invalid token' };
		}

		const user = await this.usersService.findById(decoded.sub);

		return user;
	}
}
