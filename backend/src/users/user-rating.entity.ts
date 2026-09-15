import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity'

@Entity()
@Unique(['user_id', 'category'])
export class UserRating {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 10 })
    category: 'bullet' | 'blitz' | 'rapid';

    @Column({ type: 'int', default: 800 })
    rating: number;

    @Column({ type: 'int', default: 0 })
    games_played: number;

    @Column({ type: 'int', default: 0 })
    wins: number;

    @Column({ type: 'int', default: 0 })
    losses: number;

    @Column({ type: 'int', default: 0 })
    draws: number;

    @Column({ type: 'boolean', default: true })
    is_provisional: boolean; // true while games_played < 5
}
