import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register({ email, username, password }) {
	// add validation later
	
	const hashedPassword = await bcrypt.hash(password, 10);

    return this.usersService.create({
      email,
      username,
      password: hashedPassword,
    });
  }

  async login({ email, password }) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

	const isMatch = await bcrypt.compare(password, user.password);

	if (!isMatch) {
		throw new UnauthorizedException('Invalid credentials');
	}

    return {
      message: 'login successful',
      user,
    };
  }
}
