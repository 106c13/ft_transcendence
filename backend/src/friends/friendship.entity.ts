import {
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	CreateDateColumn,
	Unique,
} from 'typeorm'
import { User } from '../users/user.entity'

@Entity()
@Unique(['user1', 'user2'])
export class Friendship {
	@PrimaryGeneratedColumn()
	id: number

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	user1: User

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	user2: User

	@CreateDateColumn()
	created_at: Date
}
