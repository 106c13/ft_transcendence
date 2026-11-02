import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

function isValidEmail(email: string) {
	return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 256);
}

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) { }

	private generateToken(user: User): string {
		const payload = {
			sub: user.id,
			username: user.username,
			email: user.email,
		};

		return this.jwtService.sign(payload, {
			expiresIn: '7d',
		});
	}

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
		if (!email || !isValidEmail(email)) {
			return { message: 'invalid_email_format', token: null };
		}

		if (!username || username.length > 15) {
			return { message: 'username_too_long', token: null };
		}

		if (/[^a-zA-Z0-9_]/.test(username)) {
			return { message: 'username_invalid_chars', token: null };
		}

		if (!password || password.length < 8) {
			return { message: 'password_too_short', token: null };
		}

		if (password !== repassword) {
			return { message: 'passwords_do_not_match', token: null };
		}

		const hasLetter = /[a-zA-Z]/.test(password);
		const hasNumber = /[0-9]/.test(password);
		const hasSpecial = /[^a-zA-Z0-9]/.test(password);

		if (!hasLetter || !hasNumber || !hasSpecial) {
			return { message: 'password_complexity_error', token: null };
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		email = email.trim().toLowerCase();
		username = username.trim().toLowerCase();

		const isDublicateEmail = await this.usersService.findByEmail(email);
		const isDublicateUsername = await this.usersService.findByUsername(username);

		if (isDublicateEmail || isDublicateUsername) {
			return { message: 'user_already_exists', token: null };
		}

		const user: User = await this.usersService.create({
			email,
			username,
			password: hashedPassword,
		});

		const token: string = this.generateToken(user);

		return {
			message: 'account_created',
			token,
		};
	}

	async login({ email, password }) {
		if (!email || !password) {
			return { message: 'invalid_credentials', token: null };
		}

		const user: User | null = await this.usersService.findByEmail(email);

		if (!user) {
			return { message: 'invalid_credentials', token: null };
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			return { message: 'invalid_credentials', token: null };
		}

		const token: string = this.generateToken(user);

		return {
			message: 'login_successful',
			token,
		};
	}
}
