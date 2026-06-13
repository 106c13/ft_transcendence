import {
	Controller,
	Get,
	Post,
	Delete,
	Patch,
	Param,
	Body,
	UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Get('get/:userid')
	getNotifications(@Param('userid') userid: string) {
		return this.notificationService.getNotifications(Number(userid));
	}

	@Post('add/:userid')
	addNotification(
		@Param('userid') userid: string,
		@Body() body,
	) {
		return this.notificationService.addNotification(Number(userid), body);
	}

	@Delete('delete/:userid/:id')
	deleteNotification(
		@Param('userid') userid: string,
		@Param('id') id: string,
	) {
		return this.notificationService.deleteNotification(
			Number(userid),
			Number(id),
		);
	}

	@Patch('read/:userid/:id')
	readNotification(
		@Param('userid') userid: string,
		@Param('id') id: string,
	) {
		return this.notificationService.readNotification(
			Number(userid),
			Number(id),
		);
	}

	@Get('unread/:userid')
	getUnreadCount(@Param('userid') userid: string) {
		return this.notificationService.getUnreadCount(Number(userid));
	}
}
