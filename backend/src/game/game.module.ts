import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { Match } from './match.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Match, User]),
		UsersModule,
	],
	providers: [GameService, GameGateway],
	exports: [GameService],
})
export class GameModule {}
