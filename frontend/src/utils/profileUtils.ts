export type TabType = 'overview' | 'games' | 'friends';

export type RatingInfo = {
	rating: number;
	gamesPlayed: number;
	wins: number;
	losses: number;
	draws: number;
	isProvisional: boolean;
};

export type User = {
	id: number;
	username: string;
	email: string;
	avatar?: string;
	bio?: string;
	created_at?: string;
	status?: string;
	isOwnProfile?: boolean;
	ratings?: {
		bullet: RatingInfo | null;
		blitz: RatingInfo | null;
		rapid: RatingInfo | null;
	};
	leaderboardRating?: number;
	leaderboardRank?: number | null;
};

export type FriendStatus =
	| 'NONE'
	| 'PENDING'
	| 'ACCEPTED'
	| 'RECEIVED'
	| 'SENT';

export const isValidUsername = (username: string): boolean => {
	return /^[a-zA-Z0-9_]{1,15}$/.test(username);
};
