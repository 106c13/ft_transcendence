import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(private readonly usersService: UsersService,
			    private readonly jwtService: JwtService,
			   ) {}

	async test() {
		const email = "admin@admin.com";
		const username = "admin";
		const password = "123";

		const existingUser = await this.usersService.findByEmail(email);

		if (existingUser) {
			throw new BadRequestException('User already exits');
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		return this.usersService.create({
			email,
			username,
			password: hashedPassword,
		});
	}

	async register({ email, username, password, repassword }) {
		if (password.length < 8) {
			throw new BadRequestException('Password must be at least 8 characters long');
		}

		if (password != repassword) {
			throw new BadRequestException('Passwords doesn\'t match');
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

		const isDublicateEmail = await this.usersService.findByEmail(email);
		const isDublicateUsername = await this.usersService.findByUsername(username);

		if (isDublicateEmail || isDublicateUsername) {
			throw new BadRequestException('User already exits');
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
			throw new BadRequestException('Invalid credentials');
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			throw new BadRequestException('Invalid credentials');
		}

		const payload = {
			sub: user.id,
			username: user.username,
			email: user.email,
		};

		const token = this.jwtService.sign(payload, {
			expiresIn: '7d',
		})

		return {
			message: 'login successful',
			token,
		};
	}
}
