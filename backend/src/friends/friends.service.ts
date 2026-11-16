import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FriendRequest, FriendRequestStatus } from './friend-request.entity'
import { Friendship } from './friendship.entity'
import { User } from '../users/user.entity'
import { Notification } from '../notification/notification.entity'
import { PresenceService } from '@/presence/presence.service'

@Injectable()
export class FriendsService {
	constructor(
		@InjectRepository(FriendRequest)
		private friendRequestRepo: Repository<FriendRequest>,

		@InjectRepository(Friendship)
		private friendshipRepo: Repository<Friendship>,

		@InjectRepository(User)
		private userRepo: Repository<User>,

		@InjectRepository(Notification)
		private notificationRepo: Repository<Notification>,

		private readonly presenceService: PresenceService,
	) { }

	async sendRequest(senderId: number, receiverUsername: string) {
		const sender = await this.userRepo.findOne({
			where: { id: senderId },
		});
		if (!sender) {
			throw new NotFoundException('sender_not_found');
		}

		const receiver = await this.userRepo.findOne({
			where: { username: receiverUsername },
		});
		if (!receiver) {
			throw new NotFoundException('user_not_found');
		}

		const existingRequest = await this.getRequestStatus(senderId, receiver.id);
		if (existingRequest) {
			throw new BadRequestException('request_already_exists');
		}

		const request = this.friendRequestRepo.create({
			sender,
			receiver,
			status: FriendRequestStatus.PENDING,
		});
		await this.friendRequestRepo.save(request);

		const notification = this.notificationRepo.create({
			user_id: receiver.id,
			message: JSON.stringify({ key: 'notification_friend_request', username: sender.username }),
			link: `/profile/${sender.username}`,
			is_read: false,
		});
		await this.notificationRepo.save(notification);

		return { sender, receiver, notification };
	}

	async acceptRequest(userId: number, friendUsername: string) {
		const sender = await this.userRepo.findOne({
			where: { username: friendUsername },
		});
		if (!sender) {
			throw new NotFoundException('sender_not_found');
		}

		const receiver = await this.userRepo.findOne({
			where: { id: userId },
		});
		if (!receiver) {
			throw new NotFoundException('user_not_found');
		}

		const request = await this.friendRequestRepo.findOne({
			where: {
				sender: { id: sender.id },
				receiver: { id: receiver.id },
				status: FriendRequestStatus.PENDING,
			},
			relations: ['sender', 'receiver'],
		});
		if (!request) {
			throw new NotFoundException('request_not_found');
		}

		const id1 = Math.min(request.sender.id, request.receiver.id);
		const id2 = Math.max(request.sender.id, request.receiver.id);

		const existing = await this.friendshipRepo.findOne({
			where: {
				user1: { id: id1 },
				user2: { id: id2 },
			},
		});
		if (existing) {
			throw new BadRequestException('friendship_already_exists');
		}

		await this.notificationRepo.delete({
			user_id: userId,
			link: `/profile/${sender.username}`,
		});

		const acceptedNotification = this.notificationRepo.create({
			user_id: sender.id,
			message: JSON.stringify({ key: 'notification_friend_accepted', username: request.receiver.username }),
			link: `/profile/${request.receiver.username}`,
			is_read: false,
		});

		await this.friendshipRepo.save({
			user1: { id: id1 } as User,
			user2: { id: id2 } as User,
		});
		await this.notificationRepo.save(acceptedNotification);
		await this.friendRequestRepo.remove(request);

		return { sender, receiver, acceptedNotification };
	}

	async rejectRequest(userId: number, friendUsername: string) {
		const sender = await this.userRepo.findOne({
			where: { username: friendUsername },
		});
		if (!sender) {
			throw new NotFoundException('sender_not_found');
		}

		const receiver = await this.userRepo.findOne({
			where: { id: userId },
		});
		if (!receiver) {
			throw new NotFoundException('user_not_found');
		}

		const request = await this.friendRequestRepo.findOne({
			where: {
				sender: { id: sender.id },
				receiver: { id: receiver.id },
				status: FriendRequestStatus.PENDING,
			},
			relations: ['sender', 'receiver'],
		});
		if (!request) {
			throw new NotFoundException('request_not_found');
		}

		await this.notificationRepo.delete({
			user_id: userId,
			link: `/profile/${sender.username}`,
		});

		await this.friendRequestRepo.remove(request);

		return { sender, receiver };
	}

	async cancelRequest(userId: number, friendUsername: string) {
		const sender = await this.userRepo.findOne({
			where: { id: userId },
		});
		if (!sender) {
			throw new NotFoundException('sender_not_found');
		}

		const receiver = await this.userRepo.findOne({
			where: { username: friendUsername },
		});
		if (!receiver) {
			throw new NotFoundException('user_not_found');
		}

		const request = await this.friendRequestRepo.findOne({
			where: {
				sender: { id: sender.id },
				receiver: { id: receiver.id },
				status: FriendRequestStatus.PENDING,
			},
		});
		if (!request) {
			throw new NotFoundException('request_not_found');
		}

		await this.notificationRepo.delete({
			user_id: receiver.id,
			link: `/profile/${sender.username}`,
		});

		await this.friendRequestRepo.remove(request);

		return { sender, receiver };
	}

	async unfriend(userId: number, friendUsername: string) {
		const friend = await this.userRepo.findOne({
			where: { username: friendUsername },
		});
		if (!friend) {
			throw new NotFoundException('friend_not_found');
		}

		const friendship = await this.friendshipRepo.findOne({
			where: [
				{ user1: { id: userId }, user2: { id: friend.id } },
				{ user1: { id: friend.id }, user2: { id: userId } },
			],
		});
		if (!friendship) {
			throw new NotFoundException('friendship_not_found');
		}

		await this.friendshipRepo.remove(friendship);

		const currentUser = await this.userRepo.findOne({
			where: { id: userId },
		});

		return { currentUser, friend };
	}

	async getFriends(userId: number) {
		return this.friendshipRepo
			.createQueryBuilder('f')
			.leftJoinAndSelect('f.user1', 'user1')
			.leftJoinAndSelect('f.user2', 'user2')
			.where('user1.id = :userId OR user2.id = :userId', { userId })
			.getMany()
	}

	async getRequestStatus(senderId: number, receiverId: number) {
		return this.friendRequestRepo.findOne({
			where: [
				{ sender: { id: senderId }, receiver: { id: receiverId } },
				{ sender: { id: receiverId }, receiver: { id: senderId } },
			],
		});
	}

	async getRequestStatusByUsername(senderId: number, username: string) {
		const receiver = await this.userRepo.findOne({
			where: { username },
		})

		if (!receiver) {
			throw new NotFoundException('user_not_found')
		}

		const id1 = Math.min(senderId, receiver.id)
		const id2 = Math.max(senderId, receiver.id)

		const friendship = await this.friendshipRepo.findOne({
			where: {
				user1: { id: id1 },
				user2: { id: id2 },
			},
		})

		if (friendship) {
			return { status: 'ACCEPTED' }
		}

		const request = await this.friendRequestRepo.findOne({
			where: [
				{ sender: { id: senderId }, receiver: { id: receiver.id } },
				{ sender: { id: receiver.id }, receiver: { id: senderId } },
			],
			relations: ['sender', 'receiver'],
		})

		if (!request) {
			return { status: 'NONE' }
		}

		if (request.sender.id === senderId) {
			return { status: 'SENT' }
		}

		if (request.receiver.id === senderId) {
			return { status: 'RECEIVED' }
		}

		return { status: 'NONE' }
	}

	async getFriendList(username: string) {
		const user = await this.userRepo.findOne({
			where: { username },
		})

		if (!user) {
			throw new NotFoundException('user_not_found')
		}

		const friendships = await this.friendshipRepo.find({
			where: [
				{ user1: { id: user.id } },
				{ user2: { id: user.id } },
			],
			relations: ['user1', 'user2'],
		})

		return friendships.map(friendship => {
			const friend =
				friendship.user1.id === user.id
					? friendship.user2
					: friendship.user1

			return {
				id: friend.id,
				username: friend.username,
				avatar: friend.avatar,
				status: this.presenceService.getUserStatus(friend.id),
			}
		})
	}
}
