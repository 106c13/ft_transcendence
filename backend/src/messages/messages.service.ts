import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Message } from './messages.entity'
import { Chat } from '../chat/chat.entity'
import { User } from '../users/user.entity'
import { Notification } from '../notification/notification.entity'

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
			messages: messages.reverse(),
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

		const receiverId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id

		const notification = this.notificationRepo.create({
			user_id: receiverId,
			message: `${sender.username} sent you a message`,
			link: `/chat/${chatId}`,
			is_read: false,
		})

		await this.notificationRepo.save(notification)

		return {
			id: message.id,
			chat_id: message.chat_id,
			sender_id: message.sender_id,
			content: message.content,
			created_at: message.created_at,
		}
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
