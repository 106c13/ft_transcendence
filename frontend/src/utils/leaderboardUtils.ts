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
		category: 'bullet' | 'blitz' | 'rapid';
	};
	stats: {
		totalGames: number;
		wins: number;
		losses: number;
		draws: number;
		winRate: number;
	};
	ratings: {
		bullet: { rating: number; gamesPlayed: number; wins: number; losses: number; draws: number; isProvisional: boolean } | null;
		blitz: { rating: number; gamesPlayed: number; wins: number; losses: number; draws: number; isProvisional: boolean } | null;
		rapid: { rating: number; gamesPlayed: number; wins: number; losses: number; draws: number; isProvisional: boolean } | null;
	};
}
