import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Match {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	white_id: number;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'white_id' })
	white: User;

	@Column()
	black_id: number;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'black_id' })
	black: User;

	@Column({ nullable: true })
	winner_id: number | null;

	@ManyToOne(() => User, { nullable: true })
	@JoinColumn({ name: 'winner_id' })
	winner: User;

	@Column()
	mode: 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2';

	@Column()
	result: string; // 'CHECKMATE', 'STALEMATE', 'TIMEOUT', 'RESIGNATION', 'DRAW'

	@Column({ type: 'text' })
	pgn: string;

	@Column({ type: 'jsonb', nullable: true })
	analysis: any;

	@Column({ type: 'int', nullable: true })
	white_rating_after: number | null;

	@Column({ type: 'int', nullable: true })
	black_rating_after: number | null;

	@Column({ type: 'int', nullable: true })
	white_rating_delta: number | null;

	@Column({ type: 'int', nullable: true })
	black_rating_delta: number | null;

	@CreateDateColumn()
	played_at: Date;

}
