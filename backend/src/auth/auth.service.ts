import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

function isValidEmail(email: string) {
	return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 256);
}

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) { }

	async test() {
		const email = "admin@admin.com";
		const username = "admin";
		const password = "123";

		const existingUser = await this.usersService.findByEmail(email);

		if (existingUser) {
			throw new BadRequestException('user_already_exists');
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		return this.usersService.create({
			email,
			username,
			password: hashedPassword,
		});
	}

	async register({ email, username, password, repassword }) {
		if (email && !isValidEmail(email)) {
			throw new BadRequestException('invalid_email_format');
		}

		if (username.length > 15) {
			throw new BadRequestException('username_too_long');
		}

		if (/[^a-zA-Z0-9]/.test(username)) {
			throw new BadRequestException('username_invalid_chars');
		}

		if (password.length < 8) {
			throw new BadRequestException('password_too_short');
		}

		if (password !== repassword) {
			throw new BadRequestException('passwords_do_not_match');
		}

		const hasLetter = /[a-zA-Z]/.test(password);
		const hasNumber = /[0-9]/.test(password);
		const hasSpecial = /[^a-zA-Z0-9]/.test(password);

		if (!hasLetter || !hasNumber || !hasSpecial) {
			throw new BadRequestException('password_complexity_error');
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		email = email.trim().toLowerCase();
		username = username.trim().toLowerCase();

		const isDublicateEmail = await this.usersService.findByEmail(email);
		const isDublicateUsername = await this.usersService.findByUsername(username);

		if (isDublicateEmail || isDublicateUsername) {
			throw new BadRequestException('user_already_exists');
		}

		return this.usersService.create({
			email,
			username,
			password: hashedPassword,
		});
	}

	async login({ email, password }) {
		const user = await this.usersService.findByEmail(email);

		if (!user) {
			throw new BadRequestException('invalid_credentials');
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			throw new BadRequestException('invalid_credentials');
		}

		const payload = {
			sub: user.id,
			username: user.username,
			email: user.email,
		};

		const token = this.jwtService.sign(payload, {
			expiresIn: '7d',
		});

		return {
			message: 'login_successful',
			token,
		};
	}
}
