import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { FriendsController } from './friends.controller'
import { FriendsService } from './friends.service'
import { PresenceModule } from '@/presence/presence.module'

import { FriendRequest } from './friend-request.entity'
import { Friendship } from './friendship.entity'
import { User } from '../users/user.entity'
import { Notification } from '../notification/notification.entity'

@Module({
	imports: [
		TypeOrmModule.forFeature([
			FriendRequest,
			Friendship,
			User,
			Notification,
		]),
		PresenceModule,
	],
	controllers: [FriendsController],
	providers: [FriendsService],
	exports: [FriendsService],
})
export class FriendsModule {}
