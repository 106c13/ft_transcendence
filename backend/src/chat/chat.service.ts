import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from '../users/user.entity';
import { Message } from '../messages/messages.entity';

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(Chat)
		private chatRepository: Repository<Chat>,
		@InjectRepository(User)
		private userRepository: Repository<User>,
		@InjectRepository(Message)
		private messageRepository: Repository<Message>,
	) {}

	private formatChat(
		chat: Chat,
		unreadCount = 0,
		lastMessage: Message | null = null,
	) {
		return {
			id: chat.id,
			chat_id: chat.chat_id,
			user1_id: chat.user1_id,
			user2_id: chat.user2_id,
			created_at: chat.created_at,
			user1: chat.user1
				? {
					id: chat.user1.id,
					username: chat.user1.username,
					avatar: chat.user1.avatar,
				}
				: null,
			user2: chat.user2
				? {
					id: chat.user2.id,
					username: chat.user2.username,
					avatar: chat.user2.avatar,
				}
				: null,
			unreadCount,
			lastMessage,
		};
	}

	async getOrCreateChat(currentUserId: number, otherUserId: number) {
		if (isNaN(otherUserId)) {
			throw new BadRequestException('invalid_user_id');
		}

		if (currentUserId === otherUserId) {
			throw new BadRequestException('cannot_chat_with_yourself');
		}

		const id1 = Math.min(currentUserId, otherUserId);
		const id2 = Math.max(currentUserId, otherUserId);
		const chatId = `${id1}_${id2}`;

		const existingChat = await this.getChat(chatId);
		if (existingChat) {
			return this.formatChat(existingChat);
		}

		const otherUser = await this.userRepository.findOne({ where: { id: otherUserId } });
		if (!otherUser) {
			throw new NotFoundException('user_not_found');
		}

		const newChat = await this.createChat(currentUserId, otherUserId);
		if (!newChat) {
			throw new NotFoundException('cannot_create_chat');
		}

		return this.formatChat(newChat);
	}

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
			throw new NotFoundException('current_user_not_found');
		}

		const otherUser = await this.userRepository.findOne({ where: { id: otherUserId } });
		if (!otherUser) {
			throw new NotFoundException('other_user_not_found');
		}

		const chat = this.chatRepository.create({
			chat_id: chatId,
			user1_id: smallerId,
			user2_id: largerId,
		});

		await this.chatRepository.save(chat);

		return this.getChat(chatId);
	}

	async getUserChats(userId: number) {
		const chats = await this.chatRepository
			.createQueryBuilder('chat')
			.where('chat.user1_id = :userId OR chat.user2_id = :userId', { userId })
			.leftJoinAndSelect('chat.user1', 'user1')
			.leftJoinAndSelect('chat.user2', 'user2')
			.orderBy('chat.created_at', 'DESC')
			.getMany();

		return Promise.all(
			chats.map(async (chat) => {
				const unreadCount = await this.messageRepository
					.createQueryBuilder('message')
					.where(
						'message.chat_id = :chatId AND message.sender_id != :userId AND message.is_read = false',
						{
							chatId: chat.chat_id,
							userId,
						},
					)
					.getCount();

				const lastMessage = await this.messageRepository.findOne({
					where: { chat_id: chat.chat_id },
					order: { created_at: 'DESC' },
				});

				return this.formatChat(chat, unreadCount, lastMessage);
			}),
		);
	}
}
