import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register({ email, username, password }) {
	// add validation later
    return this.usersService.create({
      email,
      username,
      password,
    });
  }

  async login({ username, password }) {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      message: 'login successful',
      user,
    };
  }
}
