import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { Chat } from './chat.entity'
import { User } from '../users/user.entity'
import { Notification } from '../notification/notification.entity'
import { Message } from '../messages/messages.entity'
import { UsersModule } from '../users/users.module'
import { MessagesModule } from '../messages/messages.module'

@Module({
	imports: [
		TypeOrmModule.forFeature([Chat, User, Notification, Message]),
		UsersModule,
		MessagesModule,
	],
	controllers: [ChatController],
	providers: [ChatService],
	exports: [ChatService],
})
export class ChatModule {}
