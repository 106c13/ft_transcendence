import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { ChallengeGateway } from './challenge.gateway';
import { GameController } from './game.controller';
import { Match } from './match.entity';
import { User } from '../users/user.entity';
import { UserRating } from '@/users/user-rating.entity';
import { RatingService } from './rating.service';
import { UsersModule } from '../users/users.module';
import { FriendsModule } from '../friends/friends.module';
import { PresenceModule } from '@/presence/presence.module';
import { forwardRef } from '@nestjs/common';

@Module({
	imports: [
		TypeOrmModule.forFeature([Match, User, UserRating]),
		forwardRef(() => UsersModule),
		FriendsModule,
		PresenceModule,
	],
	controllers: [GameController],
	providers: [
		GameService,
		GameGateway,
		ChallengeGateway,
		RatingService,
	],
	exports: [
		GameService,
		RatingService,
	],
})
export class GameModule {}

