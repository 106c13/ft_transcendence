import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { ChallengeGateway } from './challenge.gateway';
import { GameController } from './game.controller';
import { LeaderboardController } from './leaderboard.controller';
import { Match } from './match.entity';
import { User } from '../users/user.entity';
import { UserRating } from '@/users/user-rating.entity';
import { RatingService } from './rating.service';
import { LeaderboardService } from './leaderboard.service';
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
	controllers: [GameController, LeaderboardController],
	providers: [
		GameService,
		GameGateway,
		ChallengeGateway,
		RatingService,
		LeaderboardService,
	],
	exports: [
		GameService,
		RatingService,
		LeaderboardService,
	],
})
export class GameModule {}

