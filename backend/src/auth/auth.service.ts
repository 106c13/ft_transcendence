import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(private readonly usersService: UsersService) {}

	async register({ email, username, password }) {
		if (password.length < 8) {
			throw new BadRequestException('Password must be at least 8 characters long');
		}

		const hasLetter = /[a-zA-Z]/.test(password);
		const hasNumber = /[0-9]/.test(password);
		const hasSpecial = /[^a-zA-Z0-9]/.test(password);

		if (!hasLetter || !hasNumber || !hasSpecial) {
			throw new BadRequestException('Password must contain at least one letter, one number, and one special character');
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		email = email.trim().toLowerCase();
		username = username.trim().toLowerCase();

		return this.usersService.create({
			email,
			username,
			password: hashedPassword,
		});
	}

	async login({ email, password }) {
		const user = await this.usersService.findByEmail(email);

		if (!user) {
			throw new BadRequestException('Invalid credentials');
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			throw new BadRequestException('Invalid credentials');
		}

		return {
			message: 'login successful',
			user,
		};
	}
}
