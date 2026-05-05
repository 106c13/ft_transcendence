import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { FriendsController } from './friends.controller'
import { FriendsService } from './friends.service'

import { FriendRequest } from './friend-request.entity'
import { Friendship } from './friendship.entity'
import { User } from '../users/user.entity'

@Module({
	imports: [
		TypeOrmModule.forFeature([
			FriendRequest,
			Friendship,
			User,
		]),
	],
	controllers: [FriendsController],
	providers: [FriendsService],
	exports: [FriendsService],
})
export class FriendsModule {}
