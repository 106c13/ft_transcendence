import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserRating } from '@/users/user-rating.entity';
import { RatingCategory, RatingInfo } from './rating.service';
import { PresenceService } from '@/presence/presence.service';

export interface LeaderboardPlayer {
	rank: number;
	userId: number;
	username: string;
	avatar: string | null;
	status: 'ONLINE' | 'OFFLINE' | 'INGAME';
	isActive: boolean;
	leaderboardRating: number;
	highestRating: {
		rating: number;
		category: RatingCategory;
	};
	stats: {
		totalGames: number;
		wins: number;
		losses: number;
		draws: number;
		winRate: number; // percentage, e.g. 52.5
	};
	ratings: Record<RatingCategory, RatingInfo | null>;
}

export interface LeaderboardQueryDto {
	page?: number;
	limit?: number;
	search?: string;
	mode?: 'all' | RatingCategory;
	minGames?: number;
	minWinRate?: number;
	minRating?: number;
	maxRating?: number;
	tier?: 'all' | 'grandmaster' | 'master' | 'expert' | 'intermediate' | 'silver' | 'bronze';
	status?: 'all' | 'online' | 'ingame';
	sortBy?: 'leaderboardRating' | 'highestRating' | 'winRate' | 'totalGames' | 'wins' | 'bullet' | 'blitz' | 'rapid' | 'username';
	order?: 'asc' | 'desc';
}

export interface LeaderboardResponse {
	players: LeaderboardPlayer[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

@Injectable()
export class LeaderboardService {
	private cacheTimestamp: number = 0;
	private cachedStandings: LeaderboardPlayer[] = [];
	private readonly CACHE_TTL_MS = 5000; // 5 seconds cache

	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		@InjectRepository(UserRating)
		private readonly ratingRepo: Repository<UserRating>,

		private readonly presenceService: PresenceService,
	) {}

	invalidateCache(): void {
		this.cacheTimestamp = 0;
	}

	/**
	 * Calculates the composite Leaderboard Rating across all formats:
	 * 1. Considers ratings in bullet, blitz, rapid with confidence weighting.
	 * 2. Unplayed formats are excluded if active formats exist (default 800 if 0 games overall).
	 * 3. Confidence weighting: 5+ games = 1.0, 1-4 games = 0.5 + 0.1 * games.
	 * 4. Versatility bonus: +15 for 2 calibrated formats (>= 5 games), +30 for 3 calibrated formats, +5 for multi-format provisional.
	 */
	calculateLeaderboardRating(ratings: Record<RatingCategory, RatingInfo | null>): number {
		const categories: RatingCategory[] = ['bullet', 'blitz', 'rapid'];
		let weightedSum = 0;
		let totalWeight = 0;
		let calibratedCount = 0;
		let activeCount = 0;

		for (const cat of categories) {
			const info = ratings[cat];
			if (info && info.gamesPlayed > 0) {
				activeCount++;
				const weight = info.gamesPlayed >= 5 ? 1.0 : 0.5 + 0.1 * info.gamesPlayed;
				weightedSum += info.rating * weight;
				totalWeight += weight;

				if (info.gamesPlayed >= 5) {
					calibratedCount++;
				}
			}
		}

		if (totalWeight === 0) {
			return 800;
		}

		const composite = weightedSum / totalWeight;
		let versatilityBonus = 0;
		if (calibratedCount >= 3) {
			versatilityBonus = 30;
		} else if (calibratedCount === 2) {
			versatilityBonus = 15;
		} else if (activeCount > 1) {
			versatilityBonus = 5;
		}

		return Math.round(composite + versatilityBonus);
	}

	/**
	 * Computes and returns the overall standings of all players sorted by default:
	 * Leaderboard Rating DESC, Win Rate DESC, Total Games DESC, Username ASC.
	 */
	async getAllStandings(): Promise<LeaderboardPlayer[]> {
		const now = Date.now();
		if (this.cachedStandings.length > 0 && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
			return this.cachedStandings;
		}

		const [users, allRatings] = await Promise.all([
			this.userRepo.find({
				select: ['id', 'username', 'avatar'],
			}),
			this.ratingRepo.find(),
		]);

		// Group ratings by user_id
		const ratingsByUser = new Map<number, Record<RatingCategory, RatingInfo | null>>();

		for (const r of allRatings) {
			if (!ratingsByUser.has(r.user_id)) {
				ratingsByUser.set(r.user_id, {
					bullet: null,
					blitz: null,
					rapid: null,
				});
			}
			ratingsByUser.get(r.user_id)![r.category] = {
				rating: r.rating,
				gamesPlayed: r.games_played,
				wins: r.wins,
				losses: r.losses,
				draws: r.draws,
				isProvisional: r.is_provisional,
			};
		}

		const players: LeaderboardPlayer[] = users.map((u) => {
			const userRatings = ratingsByUser.get(u.id) || {
				bullet: null,
				blitz: null,
				rapid: null,
			};

			const categories: RatingCategory[] = ['bullet', 'blitz', 'rapid'];
			let totalGames = 0;
			let wins = 0;
			let losses = 0;
			let draws = 0;
			let highestRating = 800;
			let highestCategory: RatingCategory = 'blitz';

			for (const cat of categories) {
				const r = userRatings[cat];
				if (r) {
					totalGames += r.gamesPlayed;
					wins += r.wins;
					losses += r.losses;
					draws += r.draws;
					if (r.rating > highestRating) {
						highestRating = r.rating;
						highestCategory = cat;
					}
				}
			}

			const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0;
			const lbRating = this.calculateLeaderboardRating(userRatings);

			const userStatus = this.presenceService.getUserStatus(u.id);
			const isActive = this.presenceService.isUserOnline(u.id);

			return {
				rank: 0, // Assigned after sorting
				userId: u.id,
				username: u.username,
				avatar: u.avatar ?? null,
				status: userStatus,
				isActive,
				leaderboardRating: lbRating,
				highestRating: {
					rating: highestRating,
					category: highestCategory,
				},
				stats: {
					totalGames,
					wins,
					losses,
					draws,
					winRate,
				},
				ratings: userRatings,
			};
		});

		// Sort by default: Leaderboard Rating DESC, Win Rate DESC, Total Games DESC, Username ASC
		players.sort((a, b) => {
			if (b.leaderboardRating !== a.leaderboardRating) {
				return b.leaderboardRating - a.leaderboardRating;
			}
			if (b.stats.winRate !== a.stats.winRate) {
				return b.stats.winRate - a.stats.winRate;
			}
			if (b.stats.totalGames !== a.stats.totalGames) {
				return b.stats.totalGames - a.stats.totalGames;
			}
			return a.username.localeCompare(b.username);
		});

		// Assign ranks 1..N based on default standings
		players.forEach((p, idx) => {
			p.rank = idx + 1;
		});

		this.cachedStandings = players;
		this.cacheTimestamp = now;

		return players;
	}

	/**
	 * Gets a specific user's leaderboard rating and rank
	 */
	async getUserLeaderboardInfo(userId: number): Promise<{ leaderboardRating: number; rank: number | null }> {
		const standings = await this.getAllStandings();
		const player = standings.find((p) => p.userId === userId);
		if (!player) {
			return { leaderboardRating: 800, rank: null };
		}
		return {
			leaderboardRating: player.leaderboardRating,
			rank: player.rank,
		};
	}

	/**
	 * Fetches paginated, filtered, and sorted leaderboard players.
	 */
	async getLeaderboard(query: LeaderboardQueryDto): Promise<LeaderboardResponse> {
		const allPlayers = await this.getAllStandings();
		let filtered = [...allPlayers];

		// 1. Search by username
		if (query.search && query.search.trim().length > 0) {
			const searchLower = query.search.trim().toLowerCase();
			filtered = filtered.filter((p) => p.username.toLowerCase().includes(searchLower));
		}

		// 2. Filter by mode focus
		if (query.mode && query.mode !== 'all') {
			filtered = filtered.filter((p) => {
				const r = p.ratings[query.mode as RatingCategory];
				return r && r.gamesPlayed > 0;
			});
		}

		// 3. Min games filter
		if (query.minGames !== undefined && query.minGames > 0) {
			filtered = filtered.filter((p) => p.stats.totalGames >= query.minGames!);
		}

		// 4. Min win rate filter
		if (query.minWinRate !== undefined && query.minWinRate > 0) {
			filtered = filtered.filter((p) => p.stats.winRate >= query.minWinRate!);
		}

		// 5. Min / Max Rating filter
		if (query.minRating !== undefined && query.minRating > 0) {
			filtered = filtered.filter((p) => p.leaderboardRating >= query.minRating!);
		}
		if (query.maxRating !== undefined && query.maxRating > 0) {
			filtered = filtered.filter((p) => p.leaderboardRating <= query.maxRating!);
		}

		// 6. Tier filter
		if (query.tier && query.tier !== 'all') {
			filtered = filtered.filter((p) => {
				const r = p.leaderboardRating;
				switch (query.tier) {
					case 'grandmaster':
						return r >= 1000;
					case 'master':
						return r >= 900 && r < 1000;
					case 'expert':
						return r >= 850 && r < 900;
					case 'intermediate':
						return r >= 800 && r < 850;
					case 'silver':
						return r >= 750 && r < 800;
					case 'bronze':
						return r < 750;
					default:
						return true;
				}
			});
		}

		// 7. Status filter
		if (query.status && query.status !== 'all') {
			filtered = filtered.filter((p) => {
				if (query.status === 'online') return p.status === 'ONLINE' || p.status === 'INGAME';
				if (query.status === 'ingame') return p.status === 'INGAME';
				return true;
			});
		}

		// 8. Sorting
		const sortBy = query.sortBy || 'leaderboardRating';
		const order = query.order || 'desc';
		const isAsc = order === 'asc';

		filtered.sort((a, b) => {
			let valA: number | string = 0;
			let valB: number | string = 0;

			switch (sortBy) {
				case 'leaderboardRating':
					valA = a.leaderboardRating;
					valB = b.leaderboardRating;
					break;
				case 'highestRating':
					valA = a.highestRating.rating;
					valB = b.highestRating.rating;
					break;
				case 'winRate':
					valA = a.stats.winRate;
					valB = b.stats.winRate;
					break;
				case 'totalGames':
					valA = a.stats.totalGames;
					valB = b.stats.totalGames;
					break;
				case 'wins':
					valA = a.stats.wins;
					valB = b.stats.wins;
					break;
				case 'bullet':
					valA = a.ratings.bullet?.rating ?? 0;
					valB = b.ratings.bullet?.rating ?? 0;
					break;
				case 'blitz':
					valA = a.ratings.blitz?.rating ?? 0;
					valB = b.ratings.blitz?.rating ?? 0;
					break;
				case 'rapid':
					valA = a.ratings.rapid?.rating ?? 0;
					valB = b.ratings.rapid?.rating ?? 0;
					break;
				case 'username':
					return isAsc ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username);
				default:
					valA = a.leaderboardRating;
					valB = b.leaderboardRating;
					break;
			}

			if (valA === valB) {
				return b.leaderboardRating - a.leaderboardRating;
			}
			return isAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
		});

		// 9. Pagination (exactly 30 items per page by default)
		const page = Math.max(1, query.page ? Number(query.page) : 1);
		const limit = Math.max(1, query.limit ? Number(query.limit) : 30);
		const total = filtered.length;
		const totalPages = Math.ceil(total / limit) || 1;
		const startIndex = (page - 1) * limit;
		const paginatedPlayers = filtered.slice(startIndex, startIndex + limit);

		return {
			players: paginatedPlayers,
			total,
			page,
			limit,
			totalPages,
		};
	}
}
