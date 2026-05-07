import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn
} from 'typeorm';
import { User } from '../users/user.entity'

@Entity()
export class Notification {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	user_id: number;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'user_id' })
	user: User;

	@Column({ type: 'text' })
	message: string;

	@Column({ type: 'varchar', length: 255 })
	link: string;

	@Column({ default: false })
	is_read: boolean;

	@CreateDateColumn({ type: 'timestamp' })
	created_at: Date;
}
