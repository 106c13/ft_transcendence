import { Injectable } from '@nestjs/common';
import { UserRating } from '@/users/user-rating.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/users/user.entity';

export type RatingCategory = 'bullet' | 'blitz' | 'rapid';

export interface RatingInfo {
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    isProvisional: boolean;
}

export function getRatingCategory(mode: string): RatingCategory {
    return mode.replace('+2', '') as RatingCategory;
}

@Injectable()
export class RatingService {
    constructor(
        @InjectRepository(UserRating)
        private ratingRepo: Repository<UserRating>,

        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async getOrCreateRating(userId: number, category: RatingCategory): Promise<UserRating> {
        let rating = await this.ratingRepo.findOne({
            where: { user_id: userId, category },
        });

        if (!rating) {
            rating = this.ratingRepo.create({
                user_id: userId,
                category,
            });

            await this.ratingRepo.save(rating);
        }

        return rating;
    }

    async getRating(userId: number, category: RatingCategory): Promise<UserRating | null> {
        return this.ratingRepo.findOne({
            where: { user_id: userId, category },
        });
    }

    async getAllRatings(userId: number): Promise<Record<RatingCategory, RatingInfo | null>> {
        const ratings = await this.ratingRepo.find({
            where: { user_id: userId },
        });

        const result: Record<RatingCategory, RatingInfo | null> = {
            bullet: null,
            blitz: null,
            rapid: null,
        };

        for (const r of ratings) {
            result[r.category] = {
                rating: r.rating,
                gamesPlayed: r.games_played,
                wins: r.wins,
                losses: r.losses,
                draws: r.draws,
                isProvisional: r.is_provisional,
            }
        }

        return result;
    }

    async getAllRatingsByUsername(username: string): Promise<Record<RatingCategory, RatingInfo | null>> {
        const user = await this.userRepo.findOne({ where: { username } });

        if (!user)
            return { bullet: null, blitz: null, rapid: null };

        return this.getAllRatings(user.id);
    }

    async getMatchmakingRating(userId: number, category: RatingCategory): Promise<{
        rating: number;
        isProvisional: boolean;
    }> {
        const ratingRecord = await this.getRating(userId, category);
        if (!ratingRecord)
            return { rating: 800, isProvisional: true };

        return {
            rating: ratingRecord.rating,
            isProvisional: ratingRecord.is_provisional,
        }
    }

    async updateRatings(
        whiteUserId: number,
        blackUserId: number,
        winnerId: number | null,
        category: RatingCategory,
    ): Promise<{
        whiteRating: number;
        blackRating: number;
        whiteDelta: number;
        blackDelta: number;
        whiteIsProvisional: boolean;
        blackIsProvisional: boolean;
    }> {
        const whiteRecord = await this.getOrCreateRating(whiteUserId, category);
        const blackRecord = await this.getOrCreateRating(blackUserId, category);

        let whiteScore: number;
        let blackScore: number;
        if (winnerId === whiteUserId) {
            whiteScore = 1.0;
            blackScore = 0.0;
        } else if (winnerId === blackUserId) {
            whiteScore = 0.0;
            blackScore = 1.0;
        } else {
            // Draw
            whiteScore = 0.5;
            blackScore = 0.5;
        }

        const whiteK = this.getKFactor(whiteRecord.games_played);
        const blackK = this.getKFactor(blackRecord.games_played);

        const whiteDelta = this.calculateEloDelta(
            whiteRecord.rating, blackRecord.rating, whiteScore, whiteK
        );
        const blackDelta = this.calculateEloDelta(
            blackRecord.rating, whiteRecord.rating, blackScore, blackK
        );

        whiteRecord.rating += whiteDelta;
        blackRecord.rating += blackDelta;

        whiteRecord.rating = Math.max(100, whiteRecord.rating);
        blackRecord.rating = Math.max(100, blackRecord.rating);

        whiteRecord.games_played += 1;
        blackRecord.games_played += 1;

        if (winnerId === whiteUserId) {
            whiteRecord.wins++;
            blackRecord.losses++;
        } else if (winnerId === blackUserId) {
            blackRecord.wins++;
            whiteRecord.losses++;
        } else {
            whiteRecord.draws++;
            blackRecord.draws++;
        }

        whiteRecord.is_provisional = whiteRecord.games_played < 5;
        blackRecord.is_provisional = blackRecord.games_played < 5;

        await this.ratingRepo.save([whiteRecord, blackRecord]);

        return {
            whiteRating: whiteRecord.rating,
            blackRating: blackRecord.rating,
            whiteDelta,
            blackDelta,
            whiteIsProvisional: whiteRecord.is_provisional,
            blackIsProvisional: blackRecord.is_provisional,
        };
    }

    private calculateEloDelta(
        ratingA: number,
        ratingB: number,
        scoreA: number,
        kA: number,
    ): number {
        const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
        return Math.round(kA * (scoreA - expectedA));
    }

    // Returns the K-factor based on how many games the player has played.
    private getKFactor(gamesPlayed: number): number {
        if (gamesPlayed < 5) return 80;   // Calibration: big swings to find the right level
        if (gamesPlayed < 30) return 40;  // New: still adjusting
        return 20;                         // Established: small, stable changes
    }
}
