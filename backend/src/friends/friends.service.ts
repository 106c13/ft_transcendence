import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FriendRequest, FriendRequestStatus } from './friend-request.entity'
import { Friendship } from './friendship.entity'
import { User } from '../users/user.entity'
import { Notification } from '../notification/notification.entity'

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
	) {}

	async sendRequest(senderId: number, receiverUsername: string) {
		const receiver = await this.userRepo.findOne({
			where: { username: receiverUsername },
		})

		if (!receiver) throw new NotFoundException('User not found')

		const sender = await this.userRepo.findOne({
			where: { id: senderId },
		})

		if (!sender) throw new NotFoundException('Sender not found')

		const existing = await this.friendRequestRepo.findOne({
			where: [
				{
					sender: { id: senderId },
					receiver: { id: receiver.id },
				},
				{
					sender: { id: receiver.id },
					receiver: { id: senderId },
				},
			],
		})

		if (existing) {
			throw new BadRequestException('Request already exists')
		}

		const request = this.friendRequestRepo.create({
			sender,
			receiver,
			status: FriendRequestStatus.PENDING,
		})

		// Create notification for receiver
		const notification = this.notificationRepo.create({
			user_id: receiver.id,
			message: `${sender.username} sent you a friend request`,
			link: `/profile/${sender.username}`,
			is_read: false,
		})
		await this.notificationRepo.save(notification)

		return this.friendRequestRepo.save(request)
	}

	async acceptRequest(userId: number, username: string) {
		const sender = await this.userRepo.findOne({
			where: { username },
		})

		if (!sender) {
			throw new NotFoundException('User not found')
		}

		const request = await this.friendRequestRepo.findOne({
			where: {
				sender: { id: sender.id },
				receiver: { id: userId },
				status: FriendRequestStatus.PENDING,
			},
			relations: ['sender', 'receiver'],
		})

		if (!request) {
			throw new NotFoundException('Request not found')
		}

		const id1 = Math.min(request.sender.id, request.receiver.id)
		const id2 = Math.max(request.sender.id, request.receiver.id)

		const existing = await this.friendshipRepo.findOne({
			where: {
				user1: { id: id1 },
				user2: { id: id2 },
			},
		})

		if (!existing) {
			const friendship = this.friendshipRepo.create({
				user1: { id: id1 } as User,
				user2: { id: id2 } as User,
			})

			await this.friendshipRepo.save(friendship)
		}

		// Delete the friend request notification
		await this.notificationRepo.delete({
			user_id: userId,
			link: `/profile/${sender.username}`,
		})

		// Create notification for sender that request was accepted
		const acceptedNotification = this.notificationRepo.create({
			user_id: sender.id,
			message: `${request.receiver.username} accepted your friend request`,
			link: `/profile/${request.receiver.username}`,
			is_read: false,
		})
		await this.notificationRepo.save(acceptedNotification)

		await this.friendRequestRepo.remove(request)

		return { success: true }
	}

	async rejectRequest(userId: number, username: string) {
		const sender = await this.userRepo.findOne({
			where: { username },
		})

		if (!sender) {
			throw new NotFoundException('User not found')
		}

		const request = await this.friendRequestRepo.findOne({
			where: {
				sender: { id: sender.id },
				receiver: { id: userId },
			},
			relations: ['sender', 'receiver'],
		})

		if (!request) {
			throw new NotFoundException('Request not found')
		}

		// Delete the friend request notification
		await this.notificationRepo.delete({
			user_id: userId,
			link: `/profile/${sender.username}`,
		})

		await this.friendRequestRepo.remove(request)

		return { success: true }
	}

	async cancelRequest(senderId: number, username: string) {
		const user = await this.userRepo.findOne({ where: { username } })
		if (!user) throw new NotFoundException()

		const request = await this.friendRequestRepo.findOne({
			where: {
				sender: { id: senderId },
				receiver: { id: user.id },
				status: FriendRequestStatus.PENDING,
			},
			relations: ['receiver'],
		})

		if (!request) throw new NotFoundException('Request not found')

		// Delete the friend request notification from receiver
		await this.notificationRepo.delete({
			user_id: user.id,
			link: `/profile/${request.receiver.username}`,
		})

		await this.friendRequestRepo.remove(request)

		return { success: true }
	}

	async unfriend(userId: number, username: string) {
		const user = await this.userRepo.findOne({ where: { username } })
		if (!user) throw new NotFoundException()

		const friendship = await this.friendshipRepo.findOne({
			where: [
				{ user1: { id: userId }, user2: { id: user.id } },
				{ user1: { id: user.id }, user2: { id: userId } },
			],
		})

		if (!friendship) throw new NotFoundException('Not friends')

		await this.friendshipRepo.remove(friendship)

		return { success: true }
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
			throw new NotFoundException('User not found')
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
			throw new NotFoundException('User not found')
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
				username: friend.username,
				avatar: friend.avatar,
			}
		})
	}
}
