import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepo: Repository<User>,
	) {}

	async createTestUser() {
		const user = this.usersRepo.create({
			email: 'test@test.com',
			username: 'admin',
			password: '123',
			avatar: 'default.jpg',
		});

		return this.usersRepo.save(user);
	}

	async create(data: { email: string; username: string; password: string }) {
		const user = this.usersRepo.create(data);
		return this.usersRepo.save(user);
	}

	async findById(id: number) {
		return this.usersRepo.findOne({ where: { id } });
	}

	async findByUsername(username: string) {
		const user = await this.usersRepo.findOne({
			where: { username },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user;
	}

	async findByEmail(email: string) {
		return this.usersRepo.findOne({
			where: { email },
		});
	}

	async updateUser(id: number, data: Partial<User>) {
		if (data.email && !isValidEmail(data.email)) {
			throw new BadRequestException('Invalid email format')
		}

		const user = await this.usersRepo.findOne({ where: { id } })

		if (!user) {
			throw new BadRequestException('User not found')
		}

		if (data.username && data.username !== user.username) {
			const exists = await this.usersRepo.findOne({
				where: { username: data.username },
			})

			if (exists) {
				throw new BadRequestException('Username already exists')
			}
		}

		if (data.email && data.email !== user.email) {
			const exists = await this.usersRepo.findOne({
				where: { email: data.email },
			})

			if (exists) {
				throw new BadRequestException('Email already taken')
			}
		}

		if (data.username) user.username = data.username
		if (data.email) user.email = data.email
		if (data.bio !== undefined) user.bio = data.bio
		
		Object.assign(user, data)

		return this.usersRepo.save(user)
	}

		async changePassword(
		userId: number,
		data: { oldPassword: string; newPassword: string }
	) {
		const user = await this.usersRepo.findOne({ where: { id: userId } })

		if (!user) {
			throw new BadRequestException('User not found')
		}

		const isMatch = await bcrypt.compare(data.oldPassword, user.password)

		if (!isMatch) {
			throw new BadRequestException('Old password is incorrect')
		}

		if (data.newPassword.length < 8) {
			throw new BadRequestException('Password too short')
		}

		const hasLetter = /[a-zA-Z]/.test(data.newPassword);
		const hasNumber = /[0-9]/.test(data.newPassword);
		const hasSpecial = /[^a-zA-Z0-9]/.test(data.newPassword);

		if (!hasLetter || !hasNumber || !hasSpecial) {
			throw new BadRequestException('Password must contain at least one letter, one number, and one special character');
		}

		const hashed = await bcrypt.hash(data.newPassword, 10)

		user.password = hashed

		await this.usersRepo.save(user)

		return { message: 'Password updated successfully' }
	}
}
