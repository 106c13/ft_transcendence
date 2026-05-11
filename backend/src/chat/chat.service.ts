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
		let chat = await this.chatRepository.findOne({
				where: { chat_id: chatId },
			});
		return chat;
	}

	async createChat(user1Id: number, user2Id: number) {
		const smallerId = Math.min(user1Id, user2Id);
		const largerId = Math.max(user1Id, user2Id);
		const chatId = `${smallerId}_${largerId}`;

		const user1 = await this.userRepository.findOne({ where: { id: user1Id } });

		if (!user1) {
			throw new NotFoundException('user not found');
		}

		const chat = this.chatRepository.create({
			chat_id: chatId,
			user1_id: smallerId,
			user2_id: largerId,
		});

		await this.chatRepository.save(chat);

		const notification = this.notificationRepo.create({
			user_id: user2Id,
			message: `${user1.username} started a new conversation`,
			link: `/chat/${chatId}`,
			is_read: false,
		});

		await this.notificationRepo.save(notification);

		return chat;
	}

	async getUserChats(userId: number) {
		const chats = await this.chatRepository
			.createQueryBuilder('chat')
			.where('chat.user1_id = :userId OR chat.user2_id = :userId', { userId })
			.leftJoinAndSelect('chat.user1', 'user1')
			.leftJoinAndSelect('chat.user2', 'user2')
			.orderBy('chat.created_at', 'DESC')
			.getMany()

		return chats
	}
}
