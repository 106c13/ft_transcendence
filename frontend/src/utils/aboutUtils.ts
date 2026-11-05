import type { TFunction } from 'i18next';

export type DevKey = 'arman' | 'narek' | 'hakob';

export interface DevProfile {
	id: DevKey;
	handle: string;
	intraUrl: string;
	pieceCode: 'P' | 'R' | 'B' | 'N' | 'Q' | 'K';
	pieceSymbol: string;
	pieceSvg: string;
	nameKey: string;
	pieceRoleKey: string;
	roleKey: string;
	statementKey: string;
	mottoKey: string;
	tacticalRoleKey: string;
	tagKeys: string[];
	highlightKeys: string[];
}

export interface TranslatedDevProfile extends DevProfile {
	name: string;
	pieceRoleName: string;
	shortRole: string;
	statement: string;
	tacticalMotto: string;
	tacticalRole: string;
	tags: string[];
	highlights: string[];
}

export function getTranslatedDev(
	dev: DevProfile,
	t: TFunction
): TranslatedDevProfile {
	return {
		...dev,
		name: t(dev.nameKey),
		pieceRoleName: t(dev.pieceRoleKey),
		shortRole: t(dev.roleKey),
		statement: t(dev.statementKey),
		tacticalMotto: t(dev.mottoKey),
		tacticalRole: t(dev.tacticalRoleKey),
		tags: dev.tagKeys.map((key) => t(key)),
		highlights: dev.highlightKeys.map((key) => t(key)),
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
		handle: '@armarake',
		intraUrl: 'https://profile-v3.intra.42.fr/users/armarake',
		pieceCode: 'N',
		pieceSymbol: '♞',
		pieceSvg: '/assets/pieces/wN.svg',
		nameKey: 'dev_name_arman',
		pieceRoleKey: 'piece_role_white_knight',
		roleKey: 'role_architecture_gameplay',
		statementKey: 'about_dev_arman_statement',
		mottoKey: 'about_dev_arman_motto',
		tacticalRoleKey: 'about_tactical_role_arman',
		tagKeys: ['tag_frontend_arch', 'tag_chess_engine', 'tag_websockets'],
		highlightKeys: [
			'about_dev_arman_highlight_1',
			'about_dev_arman_highlight_2',
			'about_dev_arman_highlight_3',
			'about_dev_arman_highlight_4',
		],
	},
	narek: {
		id: 'narek',
		handle: '@nasargsy',
		intraUrl: 'https://profile-v3.intra.42.fr/users/nasargsy',
		pieceCode: 'B',
		pieceSymbol: '♝',
		pieceSvg: '/assets/pieces/wB.svg',
		nameKey: 'dev_name_narek',
		pieceRoleKey: 'piece_role_white_bishop',
		roleKey: 'role_analysis_leaderboard',
		statementKey: 'about_dev_narek_statement',
		mottoKey: 'about_dev_narek_motto',
		tacticalRoleKey: 'about_tactical_role_narek',
		tagKeys: ['tag_stockfish', 'tag_accuracy_analytics', 'tag_leaderboard'],
		highlightKeys: [
			'about_dev_narek_highlight_1',
			'about_dev_narek_highlight_2',
			'about_dev_narek_highlight_3',
			'about_dev_narek_highlight_4',
		],
	},
	hakob: {
		id: 'hakob',
		handle: '@haaghaja',
		intraUrl: 'https://profile-v3.intra.42.fr/users/haaghaja',
		pieceCode: 'R',
		pieceSymbol: '♜',
		pieceSvg: '/assets/pieces/wR.svg',
		nameKey: 'dev_name_hakob',
		pieceRoleKey: 'piece_role_white_rook',
		roleKey: 'role_auth_messages_translations',
		statementKey: 'about_dev_hakob_statement',
		mottoKey: 'about_dev_hakob_motto',
		tacticalRoleKey: 'about_tactical_role_hakob',
		tagKeys: ['tag_project_foundation', 'tag_jwt_2fa', 'tag_chat_i18n'],
		highlightKeys: [
			'about_dev_hakob_highlight_1',
			'about_dev_hakob_highlight_2',
			'about_dev_hakob_highlight_3',
			'about_dev_hakob_highlight_4',
		],
	},
};

export const INITIAL_FEN = '8/8/8/4R3/2B5/4N3/7k/4K3 w - - 9 5';

export const MOVE_STEPS: MoveStep[] = [
	{
		ply: 0,
		moveNumber: 0,
		color: 'w',
		san: 'Start',
		from: '',
		to: '',
		piece: '',
		fen: '8/8/8/4R3/2B5/4N3/7k/4K3 w - - 9 5',
		isCheckmate: false,
	},
	{
		ply: 1,
		moveNumber: 5,
		color: 'w',
		san: 'Rg5',
		from: 'e5',
		to: 'g5',
		piece: 'r',
		fen: '8/8/8/6R1/2B5/4N3/7k/4K3 b - - 10 5',
		isCheckmate: false,
	},
	{
		ply: 2,
		moveNumber: 5,
		color: 'b',
		san: 'Kh3',
		from: 'h2',
		to: 'h3',
		piece: 'k',
		fen: '8/8/8/6R1/2B5/4N2k/8/4K3 w - - 11 6',
		isCheckmate: false,
	},
	{
		ply: 3,
		moveNumber: 6,
		color: 'w',
		san: 'Be6+',
		from: 'c4',
		to: 'e6',
		piece: 'b',
		fen: '8/8/4B3/6R1/8/4N2k/8/4K3 b - - 12 6',
		isCheckmate: false,
	},
	{
		ply: 4,
		moveNumber: 6,
		color: 'b',
		san: 'Kh4',
		from: 'h3',
		to: 'h4',
		piece: 'k',
		fen: '8/8/4B3/6R1/7k/4N3/8/4K3 w - - 13 7',
		isCheckmate: false,
	},
	{
		ply: 5,
		moveNumber: 7,
		color: 'w',
		san: 'Rg7',
		from: 'g5',
		to: 'g7',
		piece: 'r',
		fen: '8/6R1/4B3/8/7k/4N3/8/4K3 b - - 14 7',
		isCheckmate: false,
	},
	{
		ply: 6,
		moveNumber: 7,
		color: 'b',
		san: 'Kh5',
		from: 'h4',
		to: 'h5',
		piece: 'k',
		fen: '8/6R1/4B3/7k/8/4N3/8/4K3 w - - 15 8',
		isCheckmate: false,
	},
	{
		ply: 7,
		moveNumber: 8,
		color: 'w',
		san: 'Bg4+',
		from: 'e6',
		to: 'g4',
		piece: 'b',
		fen: '8/6R1/8/7k/6B1/4N3/8/4K3 b - - 16 8',
		isCheckmate: false,
	},
	{
		ply: 8,
		moveNumber: 8,
		color: 'b',
		san: 'Kh6',
		from: 'h5',
		to: 'h6',
		piece: 'k',
		fen: '8/6R1/7k/8/6B1/4N3/8/4K3 w - - 17 9',
		isCheckmate: false,
	},
	{
		ply: 9,
		moveNumber: 9,
		color: 'w',
		san: 'Nf5#',
		from: 'e3',
		to: 'f5',
		piece: 'n',
		fen: '8/6R1/7k/5N2/6B1/8/8/4K3 b - - 18 9',
		isCheckmate: true,
	},
];
