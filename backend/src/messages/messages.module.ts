import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { Message } from './messages.entity'
import { Chat } from '../chat/chat.entity'
import { User } from '../users/user.entity'
import { Notification } from '../notification/notification.entity'

@Module({
	imports: [TypeOrmModule.forFeature([Message, Chat, User, Notification])],
	controllers: [MessagesController],
	providers: [MessagesService],
	exports: [MessagesService],
})
export class MessagesModule {}
