import {
	Injectable,
	BadRequestException,
	NotFoundException,
	OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService implements OnModuleInit {
	constructor(
		@InjectRepository(Notification)
		private readonly notificationRepo: Repository<Notification>,
	) {}

	async onModuleInit() {
		try {
			await this.notificationRepo
				.createQueryBuilder()
				.delete()
				.from(Notification)
				.where("link LIKE '/chat%'")
				.execute();
		} catch (e) {
			console.error('Failed to cleanup legacy chat notifications:', e);
		}
	}

	async getNotifications(userId: number) {
		if (isNaN(userId))
			throw new BadRequestException('invalid user id');

		return this.notificationRepo
			.createQueryBuilder('notification')
			.where('notification.user_id = :userId', { userId })
			.andWhere("notification.link NOT LIKE '/chat%'")
			.orderBy('notification.created_at', 'DESC')
			.getMany();
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

	async readAllNotifications(userId: number) {
		if (isNaN(userId))
			throw new BadRequestException('invalid user id');

		await this.notificationRepo
			.createQueryBuilder()
			.update(Notification)
			.set({ is_read: true })
			.where('user_id = :userId AND is_read = false', { userId })
			.andWhere("link NOT LIKE '/chat%'")
			.execute();

		return { success: true };
	}

	async clearAllNotifications(userId: number) {
		if (isNaN(userId))
			throw new BadRequestException('invalid user id');

		await this.notificationRepo
			.createQueryBuilder()
			.delete()
			.from(Notification)
			.where('user_id = :userId', { userId })
			.andWhere("link NOT LIKE '/chat%'")
			.execute();

		return { success: true };
	}

	async getUnreadCount(userId: number) {
		if (isNaN(userId))
			throw new BadRequestException('invalid user id');

		const count = await this.notificationRepo
			.createQueryBuilder('notification')
			.where('notification.user_id = :userId', { userId })
			.andWhere('notification.is_read = false')
			.andWhere("notification.link NOT LIKE '/chat%'")
			.getCount();

		return { count };
	}
}
