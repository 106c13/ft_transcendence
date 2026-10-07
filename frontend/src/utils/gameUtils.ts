const PIECE_ASSET_DIR = '/assets/pieces';

export const getPieceImageSrc = (type: string, color: 'w' | 'b'): string => {
	return `${PIECE_ASSET_DIR}/${color}${type.toUpperCase()}.svg`;
};

export const PIECE_NAME: Record<string, string> = {
	p: 'Pawn',
	n: 'Knight',
	b: 'Bishop',
	r: 'Rook',
	q: 'Queen',
	k: 'King',
};

export const getAvatarUrl = (avatar?: string | null): string => {
	if (!avatar || avatar === 'default.jpg') return '/assets/default.jpg';
	if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) return avatar;
	return `/uploads/${avatar}`;
};

export const getModeColor = (mode?: string): string => {
	if (!mode) return '#38bdf8';
	const lower = mode.toLowerCase();
	if (lower.includes('bullet')) return '#f59e0b';
	if (lower.includes('blitz')) return '#38bdf8';
	if (lower.includes('rapid')) return '#818cf8';
	return '#38bdf8';
};

export const downloadPgn = (match: MatchRecord): void => {
	if (!match.pgn) return;
	const whiteName = match.white?.username || 'White';
	const blackName = match.black?.username || 'Black';
	const dateStr = match.played_at ? new Date(match.played_at).toISOString().split('T')[0] : 'match';
	const filename = `${whiteName}_vs_${blackName}_${dateStr}.pgn`;

	const blob = new Blob([match.pgn], { type: 'application/x-chess-pgn;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

// ── Match and Game Analysis Types ──
export type MatchRecord = {
	id: number;
	white_id: number;
	black_id: number;
	winner_id: number | null;
	mode: 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2';
	result: string;
	pgn: string;
	move_times?: number[] | null;
	played_at: string;
	analysis?: GameAnalysisResult;
	white?: { id: number; username: string; avatar?: string };
	black?: { id: number; username: string; avatar?: string };
	winner?: { id: number; username: string; avatar?: string };
	white_rating_after?: number | null;
	black_rating_after?: number | null;
	white_rating_delta?: number | null;
	black_rating_delta?: number | null;
};

export interface MoveAnalysis {
	ply: number;
	moveNumber: number;
	color: 'w' | 'b';
	san: string;
	from: string;
	to: string;
	fenBefore: string;
	fenAfter: string;
	score: number;
	mate: number | null;
	centipawnLoss?: number;
	winChance: number;
	bestMove: {
		from: string;
		to: string;
		san: string;
	} | null;
	continuation: string[];
	classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
	explanation: string;
	explanationKey?: string;
	explanationParams?: Record<string, unknown>;
}

export interface GameAnalysisResult {
	accuracy: {
		white: number;
		black: number;
	};
	summary: {
		white: Record<string, number>;
		black: Record<string, number>;
	};
	positions: MoveAnalysis[];
}

// ── Live Game Types ──
export interface LiveGamePlayer {
	id: number;
	username: string;
	avatar?: string | null;
	rating: number;
	isProvisional: boolean;
}

export interface LiveGameData {
	gameId: string;
	fen: string;
	turn: 'w' | 'b';
	mode: string;
	whiteTime: number;
	blackTime: number;
	lastMoveTime: number;
	lastMove?: { from: string; to: string } | null;
	isCheck?: boolean;
	isPaused?: boolean;
	isGameOver?: boolean;
	whitePlayer: LiveGamePlayer;
	blackPlayer: LiveGamePlayer;
}

// ── Rating Types ──
export type RatingCategory = 'bullet' | 'blitz' | 'rapid';

export type SparklinePoint = {
	date: string;
	label: string;
	rating: number;
};

export type AllTimeRatingPoint = {
	id: string | number;
	date: string;
	displayDate: string;
	rating: number;
	delta: number | null;
	result?: 'win' | 'loss' | 'draw';
	opponent?: string;
	mode: string;
};

export type ModeRatingHistory = {
	current: number;
	peak: number;
	lowest: number;
	gamesPlayed: number;
	wins: number;
	losses: number;
	draws: number;
	winRate: number;
	isProvisional: boolean;
	delta7Days: number;
	last7Days: SparklinePoint[];
	allTime: AllTimeRatingPoint[];
};
