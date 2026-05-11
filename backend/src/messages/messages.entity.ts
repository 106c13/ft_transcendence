import { 
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn
} from 'typeorm'
import { User } from '../users/user.entity'
import { Chat } from '../chat/chat.entity'

@Entity()
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	chat_id: string;

	@Column()
	sender_id: number;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'sender_id' })
	sender: User;

	@Column({ type: 'text' })
	content: string;

	@Column({ default: false })
	is_read: boolean;

	@CreateDateColumn()
	created_at: Date;
}
