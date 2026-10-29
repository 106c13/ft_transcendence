import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { FriendsController } from './friends.controller'
import { FriendsService } from './friends.service'
import { PresenceModule } from '@/presence/presence.module'

import { FriendRequest } from './friend-request.entity'
import { Friendship } from './friendship.entity'
import { User } from '../users/user.entity'
import { Notification } from '../notification/notification.entity'
import { FriendsGateway } from './friends.gateway'
import { UsersModule } from '../users/users.module'

@Module({
	imports: [
		TypeOrmModule.forFeature([
			FriendRequest,
			Friendship,
			User,
			Notification,
		]),
		PresenceModule,
		forwardRef(() => UsersModule),
	],
	controllers: [FriendsController],
	providers: [FriendsService, FriendsGateway],
	exports: [FriendsService],
})
export class FriendsModule { }
