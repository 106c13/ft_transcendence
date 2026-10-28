import type { TFunction } from 'i18next';

export type DevKey = 'arman' | 'narek' | 'hakob';

export interface DevProfile {
	id: DevKey;
	name: string;
	handle: string;
	intraUrl: string;
	pieceCode: 'K' | 'Q' | 'N';
	pieceSymbol: string;
	pieceSvg: string;
	pieceRoleName: string;
	shortRole: string;
	statement: string;
	tacticalMotto: string;
	highlights: string[];
	nameKey: string;
	pieceRoleKey: string;
	roleKey: string;
	statementKey: string;
	mottoKey: string;
	highlightKeys: string[];
}

export function getTranslatedDev(
	dev: DevProfile,
	t: TFunction
): DevProfile {
	return {
		...dev,
		name: t(dev.nameKey, dev.name),
		pieceRoleName: t(dev.pieceRoleKey, dev.pieceRoleName),
		shortRole: t(dev.roleKey, dev.shortRole),
		statement: t(dev.statementKey, dev.statement),
		tacticalMotto: t(dev.mottoKey, dev.tacticalMotto),
		highlights: dev.highlightKeys.map((key, idx) => t(key, dev.highlights[idx])),
	};
}

export interface MoveStep {
	ply: number;
	moveNumber: number;
	color: 'w' | 'b';
	san: string;
	from: string;
	to: string;
	piece: string;
	fen: string;
	isCheckmate?: boolean;
}

export const DEVS: Record<DevKey, DevProfile> = {
	arman: {
		id: 'arman',
		name: 'Arman Arakelyan',
		handle: '@armarake',
		intraUrl: 'https://profile-v3.intra.42.fr/users/armarake',
		pieceCode: 'K',
		pieceSymbol: '♚',
		pieceSvg: '/assets/pieces/wK.svg',
		pieceRoleName: 'White King',
		shortRole: 'Project Structure & Gameplay',
		statement:
			'Arman defined the overall structure of the project and developed the gameplay. He built the Dockerized microservices architecture, core chess engine rules, turn state machines, clock loops, and low-latency WebSocket matchmaking with premoves and board mechanics.',
		tacticalMotto:
			'The King anchors the board: governing system architecture, clock synchronization, and real-time gameplay loops.',
		highlights: [
			'Defined overall full-stack architecture & containerized microservices',
			'Developed core chess engine logic, turns, timers & game rules',
			'Built real-time WebSocket matchmaking, rematch flow & game synchronization',
			'Engineered interactive board with drag & drop, premoves & sound effects',
		],
		nameKey: 'dev_name_arman',
		pieceRoleKey: 'piece_role_white_king',
		roleKey: 'role_architecture_gameplay',
		statementKey: 'about_dev_arman_statement',
		mottoKey: 'about_dev_arman_motto',
		highlightKeys: [
			'about_dev_arman_highlight_1',
			'about_dev_arman_highlight_2',
			'about_dev_arman_highlight_3',
			'about_dev_arman_highlight_4',
		],
	},
	narek: {
		id: 'narek',
		name: 'Narek Sargsyan',
		handle: '@nasargsy',
		intraUrl: 'https://profile-v3.intra.42.fr/users/nasargsy',
		pieceCode: 'Q',
		pieceSymbol: '♛',
		pieceSvg: '/assets/pieces/wQ.svg',
		pieceRoleName: 'White Queen',
		shortRole: 'Game Analysis & Leaderboard',
		statement:
			'Narek created the game analysis and leaderboard. He integrated Stockfish for position evaluations, engineered move classification algorithms detecting blunders and brilliant tactics, and developed the global rating ladder with dynamic performance charts.',
		tacticalMotto:
			'The Queen commands the diagonals: evaluating positions with Stockfish depth and ranking global tournament ratings.',
		highlights: [
			'Integrated Stockfish chess analysis engine for deep game evaluation',
			'Implemented move accuracy metrics (Brilliant, Best, Mistake, Blunder)',
			'Built competitive global leaderboard with rating ladders & win rates',
			'Engineered interactive rating history charts and performance analytics',
		],
		nameKey: 'dev_name_narek',
		pieceRoleKey: 'piece_role_white_queen',
		roleKey: 'role_analysis_leaderboard',
		statementKey: 'about_dev_narek_statement',
		mottoKey: 'about_dev_narek_motto',
		highlightKeys: [
			'about_dev_narek_highlight_1',
			'about_dev_narek_highlight_2',
			'about_dev_narek_highlight_3',
			'about_dev_narek_highlight_4',
		],
	},
	hakob: {
		id: 'hakob',
		name: 'Hakob Aghajanyan',
		handle: '@haaghaja',
		intraUrl: 'https://profile-v3.intra.42.fr/users/haaghaja',
		pieceCode: 'N',
		pieceSymbol: '♞',
		pieceSvg: '/assets/pieces/wN.svg',
		pieceRoleName: 'White Knight',
		shortRole: 'Authentication, Messages & Translations',
		statement:
			'Hakob created the authentication system, messages, and translations. He implemented JWT authentication with 2FA, built real-time WebSocket chat and messaging channels, and engineered the trilingual internationalization system across English, Russian, and Armenian.',
		tacticalMotto:
			'The Knight leaps over barriers: securing player accounts, bridging live chat channels, and translating across languages.',
		highlights: [
			'Built robust authentication with JWT tokens, password security & 2FA',
			'Developed real-time direct chat & WebSocket messaging channels',
			'Implemented trilingual localization for English, Russian, and Armenian',
			'Crafted live notification bells, friend requests & user presence status',
		],
		nameKey: 'dev_name_hakob',
		pieceRoleKey: 'piece_role_white_knight',
		roleKey: 'role_auth_messages_translations',
		statementKey: 'about_dev_hakob_statement',
		mottoKey: 'about_dev_hakob_motto',
		highlightKeys: [
			'about_dev_hakob_highlight_1',
			'about_dev_hakob_highlight_2',
			'about_dev_hakob_highlight_3',
			'about_dev_hakob_highlight_4',
		],
	},
};

export const INITIAL_FEN = '8/8/8/3N4/8/8/2Q5/2K2k2 w - - 0 1';

export const MOVE_STEPS: MoveStep[] = [
	{
		ply: 0,
		moveNumber: 0,
		color: 'w',
		san: 'Start',
		from: '',
		to: '',
		piece: '',
		fen: '8/8/8/3N4/8/8/2Q5/2K2k2 w - - 0 1',
		isCheckmate: false,
	},
	{
		ply: 1,
		moveNumber: 1,
		color: 'w',
		san: 'Kd1',
		from: 'c1',
		to: 'd1',
		piece: 'k',
		fen: '8/8/8/3N4/8/8/2Q5/3K1k2 b - - 1 1',
		isCheckmate: false,
	},
	{
		ply: 2,
		moveNumber: 1,
		color: 'b',
		san: 'Kg1',
		from: 'f1',
		to: 'g1',
		piece: 'k',
		fen: '8/8/8/3N4/8/8/2Q5/3K2k1 w - - 2 2',
		isCheckmate: false,
	},
	{
		ply: 3,
		moveNumber: 2,
		color: 'w',
		san: 'Ne3',
		from: 'd5',
		to: 'e3',
		piece: 'n',
		fen: '8/8/8/8/8/4N3/2Q5/3K2k1 b - - 3 2',
		isCheckmate: false,
	},
	{
		ply: 4,
		moveNumber: 2,
		color: 'b',
		san: 'Kh1',
		from: 'g1',
		to: 'h1',
		piece: 'k',
		fen: '8/8/8/8/8/4N3/2Q5/3K3k w - - 4 3',
		isCheckmate: false,
	},
	{
		ply: 5,
		moveNumber: 3,
		color: 'w',
		san: 'Qg2#',
		from: 'c2',
		to: 'g2',
		piece: 'q',
		fen: '8/8/8/8/8/4N3/6Q1/3K3k b - - 5 3',
		isCheckmate: true,
	},
];
