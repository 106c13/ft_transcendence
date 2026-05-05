import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';
import { AuthService } from './auth/auth.service';
import { FriendsService} from './friends/friends.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
	private readonly friendsService: FriendsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

}
