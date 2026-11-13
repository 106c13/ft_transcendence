import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import {
	getAvatarUrl,
	getPieceImageSrc,
	formatMoveTime,
} from '../../utils/gameUtils';
import type {
	LiveGamePlayer,
	CapturedPieceItem,
} from '../../utils/gameUtils';
import styles from './OngoingGamePlayerBanner.module.css';

type Props = {
	player: LiveGamePlayer;
	color: 'w' | 'b';
	isHero: boolean;
	isPlayerTurn: boolean;
	isPlayerWinner: boolean;
	baseMode: string;
	capturedPieces: CapturedPieceItem[];
	materialDiff: number;
	latestSan: string | null;
	latestTimeSpent?: number;
};

const OngoingGamePlayerBanner = ({
	player,
	color,
	isHero,
	isPlayerTurn,
	isPlayerWinner,
	baseMode,
	capturedPieces,
	materialDiff,
	latestSan,
	latestTimeSpent,
}: Props) => {
	const { t } = useTranslation();

	const modeClass =
		baseMode === 'bullet'
			? styles.modeBullet
			: baseMode === 'blitz'
			? styles.modeBlitz
			: baseMode === 'rapid'
			? styles.modeRapid
			: styles.modeDefault;

	return (
		<div className={styles.playerBlock}>
			<div className={styles.playerLeftGroup}>
				<div className={styles.avatarAnchor}>
					<img
						src={getAvatarUrl(player.avatar)}
						alt={player.username || t('unknown')}
						className={`${styles.playerAvatar} ${
							isPlayerTurn ? styles.activeTurnAvatar : ''
						}`}
						onError={(e) => {
							const target = e.currentTarget;
							if (!target.src.endsWith('/assets/default.jpg')) {
								target.src = '/assets/default.jpg';
							}
						}}
					/>
				</div>

				<div className={styles.playerTextStack}>
					<div className={styles.playerNameRow}>
						<span className={`${styles.playerName} ${isHero ? styles.heroName : ''}`}>
							{player.username || t('unknown')}
						</span>
						{isPlayerWinner && (
							<span className={styles.winnerPill}>
								<Trophy size={11} aria-hidden="true" />
								<span>{t('win')}</span>
							</span>
						)}
					</div>
					<span className={`${styles.playerRating} ${modeClass}`}>
						{player.rating}
					</span>
				</div>

				{(capturedPieces.length > 0 || materialDiff > 0) && (
					<div className={styles.capturedArea}>
						<div className={styles.capturedList}>
							{capturedPieces.map((pieceItem, idx) => (
								<img
									key={`${pieceItem.color}-${pieceItem.type}-${idx}`}
									src={getPieceImageSrc(pieceItem.type, pieceItem.color)}
									alt={pieceItem.type}
									className={styles.capturedPiece}
								/>
							))}
						</div>
						{materialDiff > 0 && (
							<span className={styles.materialDiff}>+{materialDiff}</span>
						)}
					</div>
				)}
			</div>

			<div
				className={styles.moveStatusArea}
				title={
					!isPlayerTurn && latestSan
						? color === 'w'
							? t('white_time_spent')
							: t('black_time_spent')
						: undefined
				}
			>
				{isPlayerTurn ? (
					<span className={styles.thinkingText}>{t('thinking')}</span>
				) : latestSan ? (
					<>
						<span className={styles.moveSan}>{latestSan}</span>
						<span className={styles.moveDot} aria-hidden="true">
							•
						</span>
						<span className={styles.moveTime}>
							{formatMoveTime(latestTimeSpent)}
						</span>
					</>
				) : (
					<span className={styles.movePlaceholder}>—</span>
				)}
			</div>
		</div>
	);
};

export default OngoingGamePlayerBanner;
