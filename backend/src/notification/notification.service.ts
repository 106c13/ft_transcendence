import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
	constructor(
		@InjectRepository(Notification)
		private readonly notificationRepo: Repository<Notification>,
	) {}

	async getNotifications(userId: number) {
		if (isNaN(userId))
			throw new BadRequestException('invalid user id');

		return this.notificationRepo.find({
			where: { user_id: userId },
			order: { created_at: 'DESC' },
		});
	}

	async addNotification(
		userId: number,
		body: { message: string; link: string },
	) {
		if (isNaN(userId))
			throw new BadRequestException('invalid user id');

		if (!body.message || !body.link)
			throw new BadRequestException('missing fields');

		const notification = this.notificationRepo.create({
			user_id: userId,
			message: body.message,
			link: body.link,
		});

		await this.notificationRepo.save(notification);

		return notification;
	}

	async deleteNotification(userId: number, notificationId: number) {
		if (isNaN(userId) || isNaN(notificationId))
			throw new BadRequestException('invalid params');

		const notification = await this.notificationRepo.findOne({
			where: {
				id: notificationId,
				user_id: userId,
			},
		});

		if (!notification)
			throw new NotFoundException('notification not found');

		await this.notificationRepo.remove(notification);

		return { success: true };
	}

	async readNotification(userId: number, notificationId: number) {
		if (isNaN(userId) || isNaN(notificationId))
			throw new BadRequestException('invalid params');

		const notification = await this.notificationRepo.findOne({
			where: {
				id: notificationId,
				user_id: userId,
			},
		});

		if (!notification)
			throw new NotFoundException('notification not found');

		notification.is_read = true;

		await this.notificationRepo.save(notification);

		return notification;
	}

	async getUnreadCount(userId: number) {
		if (isNaN(userId))
			throw new BadRequestException('invalid user id');

		const count = await this.notificationRepo.count({
			where: {
				user_id: userId,
				is_read: false,
			},
		});

		return { count };
	}
}
