import { Chess } from 'chess.js';

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

export type ExportPgnParams = {
	event?: string;
	site?: string;
	date?: Date | string;
	whiteUsername: string;
	blackUsername: string;
	winnerColor: 'w' | 'b' | null;
	gameOverReason?: string;
	isGameOver?: boolean;
	mode?: string;
	whiteElo?: number | string | null;
	blackElo?: number | string | null;
	moveSAN: string[];
};

export const formatTimeControl = (mode?: string): string => {
	switch (mode) {
		case 'bullet': return '60';
		case 'bullet+2': return '60+2';
		case 'blitz': return '180';
		case 'blitz+2': return '180+2';
		case 'rapid': return '600';
		case 'rapid+2': return '600+2';
		default: return '180';
	}
};

export const formatPgnDate = (inputDate?: Date | string): string => {
	const d = inputDate ? new Date(inputDate) : new Date();
	if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0].replace(/-/g, '.');
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}.${m}.${day}`;
};

export const formatPgnResult = (winnerColor: 'w' | 'b' | null, isGameOver = true): string => {
	if (!isGameOver) return '*';
	if (winnerColor === 'w') return '1-0';
	if (winnerColor === 'b') return '0-1';
	return '1/2-1/2';
};

export const formatPgnTermination = (
	reason: string | undefined,
	winnerColor: 'w' | 'b' | null,
	whiteName: string,
	blackName: string
): string => {
	const winnerName = winnerColor === 'w' ? whiteName : winnerColor === 'b' ? blackName : null;
	const upper = (reason || '').toUpperCase();

	if (upper.includes('TIME') || upper.includes('TIMEOUT')) {
		return winnerName ? `${winnerName} won on time` : 'Game drawn on time';
	}
	if (upper.includes('CHECKMATE')) {
		return winnerName ? `${winnerName} won by checkmate` : 'Game drawn';
	}
	if (upper.includes('RESIGN')) {
		return winnerName ? `${winnerName} won by resignation` : 'Game drawn';
	}
	if (upper.includes('DISCONNECT')) {
		return winnerName ? `${winnerName} won by disconnection` : 'Game drawn by disconnection';
	}
	if (upper.includes('ABANDON')) {
		return winnerName ? `${winnerName} won - game abandoned` : 'Game abandoned';
	}
	if (upper.includes('STALEMATE')) {
		return 'Game drawn by stalemate';
	}
	if (upper.includes('INSUFFICIENT')) {
		return 'Game drawn by insufficient material';
	}
	if (upper.includes('REPETITION')) {
		return 'Game drawn by repetition';
	}
	if (upper.includes('AGREED') || upper.includes('DRAW')) {
		return 'Game drawn by agreement';
	}

	if (winnerName) {
		return `${winnerName} won`;
	}
	return 'Game drawn';
};

export const generatePgnString = (params: ExportPgnParams): string => {
	const {
		event = 'Live Chess',
		site = 'ft_transcendence',
		date,
		whiteUsername,
		blackUsername,
		winnerColor,
		gameOverReason,
		isGameOver = true,
		mode,
		whiteElo,
		blackElo,
		moveSAN = [],
	} = params;

	const pgnDate = formatPgnDate(date);
	const result = formatPgnResult(winnerColor, isGameOver);
	const timeControl = formatTimeControl(mode);
	const termination = formatPgnTermination(gameOverReason, winnerColor, whiteUsername, blackUsername);

	const formattedWhiteElo = whiteElo != null && whiteElo !== '' ? String(Math.round(Number(whiteElo))) : '?';
	const formattedBlackElo = blackElo != null && blackElo !== '' ? String(Math.round(Number(blackElo))) : '?';

	const headers = [
		`[Event "${event}"]`,
		`[Site "${site}"]`,
		`[Date "${pgnDate}"]`,
		`[White "${whiteUsername}"]`,
		`[Black "${blackUsername}"]`,
		`[Result "${result}"]`,
		`[TimeControl "${timeControl}"]`,
		`[WhiteElo "${formattedWhiteElo}"]`,
		`[BlackElo "${formattedBlackElo}"]`,
		`[Termination "${termination}"]`,
	];

	const replay = new Chess();
	for (const san of moveSAN) {
		try {
			replay.move(san);
		} catch {
			// ignore illegal/malformed moves
		}
	}
	replay.header('Result', result);
	const rawPgn = replay.pgn();
	const movesOnly = rawPgn
		.split(/\r?\n/)
		.filter((line) => !line.startsWith('['))
		.join('\n')
		.trim();

	const movesText = movesOnly || result;
	return `${headers.join('\n')}\n\n${movesText}\n`;
};

export const exportPgnFile = (params: ExportPgnParams): void => {
	const pgnString = generatePgnString(params);
	const whiteName = params.whiteUsername || 'White';
	const blackName = params.blackUsername || 'Black';
	const dateStr = formatPgnDate(params.date).replace(/\./g, '-');
	const filename = `${whiteName}_vs_${blackName}_${dateStr}.pgn`;

	const blob = new Blob([pgnString], { type: 'application/x-chess-pgn;charset=utf-8' });
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
