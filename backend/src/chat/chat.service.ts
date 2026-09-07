import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from '../users/user.entity';
import { Notification } from '../notification/notification.entity';
import { Message } from '../messages/messages.entity';

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(Chat)
		private chatRepository: Repository<Chat>,
		@InjectRepository(User)
		private userRepository: Repository<User>,
		@InjectRepository(Notification)
		private notificationRepo: Repository<Notification>,
		@InjectRepository(Message)
		private messageRepository: Repository<Message>,
	) {}

	async getChat(chatId: string) {
		const chat = await this.chatRepository
			.createQueryBuilder('chat')
			.where('chat.chat_id = :chatId', { chatId })
			.leftJoinAndSelect('chat.user1', 'user1')
			.leftJoinAndSelect('chat.user2', 'user2')
			.getOne();

		return chat;
	}

	async createChat(currentUserId: number, otherUserId: number) {
		const smallerId = Math.min(currentUserId, otherUserId);
		const largerId = Math.max(currentUserId, otherUserId);
		const chatId = `${smallerId}_${largerId}`;

		const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } });
		if (!currentUser) {
			throw new NotFoundException('Current user not found');
		}

		const otherUser = await this.userRepository.findOne({ where: { id: otherUserId } });
		if (!otherUser) {
			throw new NotFoundException('Other user not found');
		}

		const chat = this.chatRepository.create({
			chat_id: chatId,
			user1_id: smallerId,
			user2_id: largerId,
		});

		await this.chatRepository.save(chat);

		const notification = this.notificationRepo.create({
			user_id: otherUserId,
			message: `${currentUser.username} started a new conversation`,
			link: `/chat/${currentUser.id}`,
			is_read: false,
		});

		await this.notificationRepo.save(notification);

		return this.getChat(chatId);
	}

	async getUserChats(userId: number) {
		const chats = await this.chatRepository
			.createQueryBuilder('chat')
			.where('chat.user1_id = :userId OR chat.user2_id = :userId', { userId })
			.leftJoinAndSelect('chat.user1', 'user1')
			.leftJoinAndSelect('chat.user2', 'user2')
			.orderBy('chat.created_at', 'DESC')
			.getMany()

		return chats.map(chat => ({
			id: chat.id,
			chat_id: chat.chat_id,
			user1_id: chat.user1_id,
			user2_id: chat.user2_id,
			user1: chat.user1 ? {
				id: chat.user1.id,
				username: chat.user1.username,
				avatar: chat.user1.avatar,
			} : null,
			user2: chat.user2 ? {
				id: chat.user2.id,
				username: chat.user2.username,
				avatar: chat.user2.avatar,
			} : null,
		}))
	}
}
