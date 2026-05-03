import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	email: string;

	@Column({ unique: true })
	username: string;

	@Column()
	password: string;

	@Column({ nullable: true })
	avatar: string;

	@Column({ nullable: true })
	bio: string;

	@Column({ default: false })
	is_active: boolean;

	@Column({ type: 'timestamp', nullable: true })
	last_seen: Date;

	@Column({ default: false })
	email_verified: boolean;
}
