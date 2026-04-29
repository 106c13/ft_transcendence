import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async createTestUser() {
    const user = this.usersRepo.create({
      email: 'test@test.com',
      username: 'admin',
      password: '123',
	  avatar: 'default.jpg',
    });

    return this.usersRepo.save(user);
  }
  async create(data: { email: string; username: string; password: string }) {
  	const user = this.usersRepo.create(data);
  	return this.usersRepo.save(user);
	}

  async findByUsername(username: string) {
  	return this.usersRepo.findOne({
    	where: { username },
  	});
  }

  async findByEmail(email: string) {
	  return this.usersRepo.findOne({
		  where: { email },
	  });}
}
