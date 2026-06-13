import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Chat {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	chat_id: string;

	@Column()
	user1_id: number;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'user1_id' })
	user1: User;

	@Column()
	user2_id: number;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'user2_id' })
	user2: User;

	@CreateDateColumn()
	created_at: Date;
}
