import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DEVS, getTranslatedDev } from '../../utils/aboutUtils';
import type { DevKey } from '../../utils/aboutUtils';
import styles from './AboutBoard.module.css';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface Props {
	fen: string;
	isCheckmate: boolean;
	isSmooth?: boolean;
	onTogglePlay?: () => void;
}

interface PieceData {
	id: 'wK' | 'wR' | 'wB' | 'wN' | 'bK';
	type: string;
	color: 'w' | 'b';
	dev?: DevKey;
	fileIdx: number;
	rankIdx: number;
	sq: string;
}

const PIECE_ORDER: PieceData['id'][] = ['wK', 'wR', 'wB', 'wN', 'bK'];

function parseFenToPieces(fen: string): PieceData[] {
	const [position] = fen.split(' ');
	const rows = position.split('/');
	const pieces: PieceData[] = [];

	rows.forEach((row, rIdx) => {
		let fileIdx = 0;
		for (const ch of row) {
			if (ch >= '1' && ch <= '8') {
				fileIdx += parseInt(ch, 10);
			} else {
				const sq = `${FILES[fileIdx]}${8 - rIdx}`;
				const isUpper = ch === ch.toUpperCase();
				const color: 'w' | 'b' = isUpper ? 'w' : 'b';
				const type = ch.toLowerCase();

				let id: PieceData['id'];
				let dev: DevKey | undefined;

				if (ch === 'K') id = 'wK';
				else if (ch === 'R') {
					id = 'wR';
					dev = 'hakob';
				} else if (ch === 'B') {
					id = 'wB';
					dev = 'narek';
				} else if (ch === 'N') {
					id = 'wN';
					dev = 'arman';
				} else {
					id = 'bK';
				}

				pieces.push({ id, type, color, dev, fileIdx, rankIdx: rIdx, sq });
				fileIdx++;
			}
		}
	});

	// Stable sort prevents DOM reordering stutters during diagonal or rank-crossing moves like Bg4+
	return pieces.sort((a, b) => PIECE_ORDER.indexOf(a.id) - PIECE_ORDER.indexOf(b.id));
}

export default function AboutBoard({
	fen,
	isCheckmate,
	isSmooth = true,
	onTogglePlay,
}: Props) {
	const { t } = useTranslation();
	const pieces = useMemo(() => parseFenToPieces(fen), [fen]);

	return (
		<div className={styles.boardWrapper}>
			{/* Static 64 Squares Grid */}
			<div className={styles.squaresGrid}>
				{RANKS.map((rank, rankIdx) =>
					FILES.map((file, fileIdx) => {
						const sq = `${file}${rank}`;
						const isLight = (fileIdx + rankIdx) % 2 === 0;

						return (
							<div
								key={sq}
								className={`${styles.square} ${isLight ? styles.light : styles.dark}`}
								onClick={onTogglePlay}
							>
								{fileIdx === 0 && (
									<span className={styles.coordRank}>{rank}</span>
								)}
								{rank === '1' && (
									<span className={styles.coordFile}>{file}</span>
								)}
							</div>
						);
					})
				)}
			</div>

			{/* Smooth Animated Pieces Layer */}
			<div className={styles.piecesLayer}>
				{pieces.map((p) => {
					const isWinnerKing = isCheckmate && p.id === 'wK';
					const isLoserKing = isCheckmate && p.id === 'bK';

					return (
						<div
							key={p.id}
							className={`${styles.pieceContainer} ${isSmooth ? styles.smoothPiece : ''}`}
							style={{
								transform: `translate(${p.fileIdx * 100}%, ${p.rankIdx * 100}%)`,
							}}
							title={
								p.dev
									? `${getTranslatedDev(DEVS[p.dev], t).name} (${p.sq})`
									: p.id === 'wK'
									? `${t('piece_role_white_king')} (${p.sq})`
									: `${t('piece_role_black_king')} (${p.sq})`
							}
							onClick={onTogglePlay}
						>
							<img
								src={`/assets/pieces/${p.color}${p.type.toUpperCase()}.svg`}
								alt={p.type}
								className={`${styles.pieceImg} ${isLoserKing ? styles.checkedKing : ''}`}
							/>

							{isWinnerKing && (
								<div className={styles.kingBadgeWinner} aria-label={t('winner')}>
									<svg viewBox="0 0 24 24" className={styles.kingBadgeIcon}>
										<path
											fill="currentColor"
											d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"
										/>
									</svg>
								</div>
							)}

							{isLoserKing && (
								<div className={styles.kingBadgeLoser} aria-label={t('loser')}>
									<svg viewBox="0 0 24 24" className={styles.kingBadgeIcon}>
										<path
											fill="none"
											stroke="currentColor"
											strokeWidth="3.2"
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M10 4L8 20M16 4l-2 20M4 9.5h16M3.5 14.5h16"
										/>
									</svg>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
