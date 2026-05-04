import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FriendRequest, FriendRequestStatus } from './friend-request.entity'
import { Friendship } from './friendship.entity'
import { User } from '../users/user.entity'

@Injectable()
export class FriendsService {
	constructor(
		@InjectRepository(FriendRequest)
		private friendRequestRepo: Repository<FriendRequest>,

		@InjectRepository(Friendship)
		private friendshipRepo: Repository<Friendship>,

		@InjectRepository(User)
		private userRepo: Repository<User>,
	) {}

	async sendRequest(senderId: number, receiverId: number) {
		if (senderId === receiverId) {
			throw new BadRequestException('Cannot friend yourself')
		}

		const sender = await this.userRepo.findOne({ where: { id: senderId } })
		const receiver = await this.userRepo.findOne({ where: { id: receiverId } })

		if (!sender) throw new NotFoundException('Sender not found')
		if (!receiver) throw new NotFoundException('User not found')

		const existing = await this.friendRequestRepo.findOne({
			where: [
				{ sender: { id: senderId }, receiver: { id: receiverId } },
				{ sender: { id: receiverId }, receiver: { id: senderId } },
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

		return this.friendRequestRepo.save(request)
	}
	
	async acceptRequest(requestId: number, userId: number) {
		const request = await this.friendRequestRepo.findOne({
			where: { id: requestId },
			relations: ['receiver', 'sender'],
		})

		if (!request) throw new NotFoundException('Request not found')

		if (request.receiver.id !== userId) {
			throw new BadRequestException('Not allowed')
		}

		request.status = FriendRequestStatus.ACCEPTED
		await this.friendRequestRepo.save(request)

		const id1 = Math.min(request.sender.id, request.receiver.id)
		const id2 = Math.max(request.sender.id, request.receiver.id)

		const friendship = this.friendshipRepo.create({
			user1: { id: id1 } as User,
			user2: { id: id2 } as User,
		})

		return this.friendshipRepo.save(friendship)
	}

	async rejectRequest(requestId: number, userId: number) {
		const request = await this.friendRequestRepo.findOne({
			where: { id: requestId },
			relations: ['receiver'],
		})

		if (!request) throw new NotFoundException('Request not found')

		if (request.receiver.id !== userId) {
			throw new BadRequestException('Not allowed')
		}

		request.status = FriendRequestStatus.REJECTED
		return this.friendRequestRepo.save(request)
	}

	async getFriends(userId: number) {
		return this.friendshipRepo
			.createQueryBuilder('f')
			.leftJoinAndSelect('f.user1', 'user1')
			.leftJoinAndSelect('f.user2', 'user2')
			.where('user1.id = :userId OR user2.id = :userId', { userId })
			.getMany()
	}
}
