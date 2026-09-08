import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Message } from './messages.entity'
import { Chat } from '../chat/chat.entity'
import { User } from '../users/user.entity'
import { Notification } from '../notification/notification.entity'
import { ChatGateway } from '../chat/chat.gateway'

@Injectable()
export class MessagesService {
	constructor(
		@InjectRepository(Message)
		private messageRepository: Repository<Message>,
		@InjectRepository(Chat)
		private chatRepository: Repository<Chat>,
		@InjectRepository(User)
		private userRepository: Repository<User>,
		@InjectRepository(Notification)
		private notificationRepo: Repository<Notification>,
		private chatGateway: ChatGateway,
	) {}

	async getMessages(chatId: string, options: { limit: number; offset: number }) {
		const [messages, total] = await this.messageRepository.findAndCount({
			where: { chat_id: chatId },
			relations: ['sender'],
			order: { created_at: 'DESC' },
			take: options.limit,
			skip: options.offset,
		})

		return {
			messages: messages.reverse().map(msg => ({
				id: msg.id,
				chat_id: msg.chat_id,
				sender_id: msg.sender_id,
				content: msg.content,
				created_at: msg.created_at,
				sender: msg.sender ? {
					id: msg.sender.id,
					username: msg.sender.username,
					avatar: msg.sender.avatar,
				} : null,
			})),
			total,
			limit: options.limit,
			offset: options.offset,
		}
	}

	async sendMessage(chatId: string, senderId: number, content: string) {
		const chat = await this.chatRepository.findOne({
			where: { chat_id: chatId },
		})

		if (!chat) {
			throw new NotFoundException('Chat not found')
		}

		const sender = await this.userRepository.findOne({ where: { id: senderId } })

		if (!sender) {
			throw new NotFoundException('Sender not found')
		}

		const message = this.messageRepository.create({
			chat_id: chatId,
			sender_id: senderId,
			content,
			is_read: false,
		})

		await this.messageRepository.save(message)

		const messageResponse = {
			id: message.id,
			chat_id: message.chat_id,
			sender_id: message.sender_id,
			content: message.content,
			created_at: message.created_at,
			sender: {
				id: sender.id,
				username: sender.username,
				avatar: sender.avatar,
			},
		}

		// Emit to receiver via WebSocket
		this.chatGateway.server.emit('new_message', {
			type: 'new_message',
			message: messageResponse,
		})

		return {
			id: message.id,
			chat_id: message.chat_id,
			sender_id: message.sender_id,
			content: message.content,
			created_at: message.created_at,
		}
	}

	async getUnreadCount(userId: number): Promise<number> {
		return this.messageRepository
			.createQueryBuilder('message')
			.innerJoin('chat', 'chat', 'chat.chat_id = message.chat_id')
			.where('(chat.user1_id = :userId OR chat.user2_id = :userId)', { userId })
			.andWhere('message.sender_id != :userId', { userId })
			.andWhere('message.is_read = false')
			.getCount()
	}

	async getChatUnreadCount(chatId: string, userId: number): Promise<number> {
		return this.messageRepository
			.createQueryBuilder('message')
			.where('message.chat_id = :chatId', { chatId })
			.andWhere('message.sender_id != :userId', { userId })
			.andWhere('message.is_read = false')
			.getCount()
	}

	async markChatAsRead(chatId: string, userId: number) {
		await this.messageRepository
			.createQueryBuilder()
			.update(Message)
			.set({ is_read: true })
			.where('chat_id = :chatId AND sender_id != :userId AND is_read = false', {
				chatId,
				userId,
			})
			.execute()

		this.chatGateway.server.emit('messages_read', {
			chat_id: chatId,
			reader_id: userId,
		})

		return { success: true }
	}

	async getLastMessage(chatId: string) {
		return this.messageRepository.findOne({
			where: { chat_id: chatId },
			relations: ['sender'],
			order: { created_at: 'DESC' },
		})
	}

	async deleteMessage(messageId: number, userId: number) {
		const message = await this.messageRepository.findOne({
			where: { id: messageId },
		})

		if (!message) {
			throw new NotFoundException('Message not found')
		}

		if (message.sender_id !== userId) {
			throw new BadRequestException('You can only delete your own messages')
		}

		await this.messageRepository.remove(message)

		return { success: true, messageId }
	}
}
