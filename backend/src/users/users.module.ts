import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { GameModule } from '@/game/game.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
	  TypeOrmModule.forFeature([User]),
    forwardRef(() => GameModule),
	  JwtModule.register({
		  secret: process.env.JWT_SECRET || 'your-secret-key',
		  signOptions: { expiresIn: '1d' },
	  }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
