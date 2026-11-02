import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RatingService } from '@/game/rating.service';
import { LeaderboardService } from '@/game/leaderboard.service';
import { PresenceService } from '@/presence/presence.service';

function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 256;
}

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepo: Repository<User>,
		private readonly jwtService: JwtService,
		private readonly ratingService: RatingService,
		private readonly leaderboardService: LeaderboardService,
		private readonly presenceService: PresenceService,
	) {}

	private extractUserIdFromHeader(authHeader?: string): number | null {
		if (!authHeader) {
			return null;
		}

		try {
			const token = authHeader.split(' ')[1];
			const decoded = this.jwtService.verify(token);
			return decoded.sub;
		} catch {
			return null;
		}
	}

	private async buildUserProfile(user: User, isOwnProfile: boolean) {
		const ratings = await this.ratingService.getAllRatings(user.id);
		const userStatus = this.presenceService.getUserStatus(user.id);
		const status = isOwnProfile && userStatus === 'OFFLINE' ? 'ONLINE' : userStatus;
		const lbInfo = await this.leaderboardService.getUserLeaderboardInfo(user.id);

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			bio: user.bio,
			avatar: user.avatar,
			status,
			is_active: isOwnProfile ? true : status !== 'OFFLINE',
			last_seen: user.last_seen,
			created_at: user.created_at,
			isOwnProfile,
			ratings,
			leaderboardRating: lbInfo.leaderboardRating,
			leaderboardRank: lbInfo.rank,
		};
	}

	async getMe(authHeader?: string) {
		const userId = this.extractUserIdFromHeader(authHeader);
		if (!userId) {
			return { id: null };
		}

		const user = await this.findById(userId);
		if (!user) {
			return { id: null };
		}

		return this.buildUserProfile(user, true);
	}

	async getProfileByUsername(username: string, authHeader?: string) {
		const user = await this.findByUsername(username);
		if (!user) {
			throw new NotFoundException('user_not_found');
		}

		const requesterId = this.extractUserIdFromHeader(authHeader);
		const isOwnProfile = requesterId === user.id;

		return this.buildUserProfile(user, isOwnProfile);
	}

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
		return this.usersRepo.findOne({
			where: { username },
		});
	}

	async findByEmail(email: string) {
		return this.usersRepo.findOne({
			where: { email },
		});
	}

	async updateUser(id: number, data: Partial<User>, avatarFilename?: string) {
		if (data.username !== undefined && /[^a-zA-Z0-9_]/.test(data.username)) {
			throw new BadRequestException('username_invalid_chars');
		}

		if (data.username !== undefined && data.username.length > 15) {
			throw new BadRequestException('username_too_long');
		}

		if (data.bio !== undefined && data.bio.length > 100) {
			throw new BadRequestException('bio_too_long');
		}

		if (data.email && !isValidEmail(data.email)) {
			throw new BadRequestException('invalid_email_format');
		}

		const user = await this.usersRepo.findOne({ where: { id } });

		if (!user) {
			throw new BadRequestException('user_not_found');
		}

		if (data.username && data.username !== user.username) {
			const exists = await this.usersRepo.findOne({
				where: { username: data.username },
			});

			if (exists) {
				throw new BadRequestException('username_already_exists');
			}
		}

		if (data.email && data.email !== user.email) {
			const exists = await this.usersRepo.findOne({
				where: { email: data.email },
			});

			if (exists) {
				throw new BadRequestException('email_already_exists');
			}
		}

		if (data.username) user.username = data.username;
		if (data.email) user.email = data.email;
		if (data.bio !== undefined) user.bio = data.bio;
		if (avatarFilename) user.avatar = avatarFilename;

		await this.usersRepo.save(user);

		return { success: true };
	}

	async changePassword(
		userId: number,
		data: { oldPassword: string; newPassword: string }
	) {
		const user = await this.usersRepo.findOne({ where: { id: userId } });

		if (!user) {
			throw new BadRequestException('user_not_found');
		}

		const isMatch = await bcrypt.compare(data.oldPassword, user.password);

		if (!isMatch) {
			throw new BadRequestException('old_password_incorrect');
		}

		if (data.newPassword.length < 8) {
			throw new BadRequestException('password_too_short');
		}

		const hasLetter = /[a-zA-Z]/.test(data.newPassword);
		const hasNumber = /[0-9]/.test(data.newPassword);
		const hasSpecial = /[^a-zA-Z0-9]/.test(data.newPassword);

		if (!hasLetter || !hasNumber || !hasSpecial) {
			throw new BadRequestException('password_complexity_error');
		}

		const hashed = await bcrypt.hash(data.newPassword, 10);

		user.password = hashed;

		await this.usersRepo.save(user);

		return { message: 'password_updated' };
	}

	async searchUser(query: string) {
		if (!query || query.trim() === '') {
			return [];
		}

		const users = await this.usersRepo
			.createQueryBuilder('user')
			.where('user.username ILIKE :query', { query: `%${query}%` })
			.select(['user.id', 'user.bio', 'user.username', 'user.is_active', 'user.avatar'])
			.limit(5)
			.getMany();

		return users.map((u) => ({
			id: u.id,
			username: u.username,
			avatar: u.avatar,
			bio: u.bio,
			is_active: this.presenceService.isUserOnline(u.id),
			status: this.presenceService.getUserStatus(u.id),
		}));
	}
}
