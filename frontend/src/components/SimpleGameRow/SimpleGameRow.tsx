import { useTranslation } from 'react-i18next';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import type { MatchRecord } from '../../utils/gameUtils';
import styles from './SimpleGameRow.module.css';

type Props = {
	match: MatchRecord;
	currentUsername?: string;
	onSelect: (match: MatchRecord) => void;
};

function getAvatarUrl(avatar?: string | null) {
	if (!avatar || avatar === 'default.jpg') {
		return '/assets/default.jpg';
	}
	if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
		return avatar;
	}
	return `/uploads/${avatar}`;
}

export default function SimpleGameRow({ match, currentUsername, onSelect }: Props) {
	const { t } = useTranslation();

	const isUserWhite = match.white?.username === currentUsername;
	const isUserBlack = match.black?.username === currentUsername;
	const whitePlayer = match.white;
	const blackPlayer = match.black;
	const whiteRating = match.white_rating_after;
	const blackRating = match.black_rating_after;

	// Determine result
	let outcome: 'win' | 'loss' | 'draw' = 'draw';
	if (match.winner_id) {
		if (isUserWhite) {
			outcome = match.winner_id === match.white_id ? 'win' : 'loss';
		} else if (isUserBlack) {
			outcome = match.winner_id === match.black_id ? 'win' : 'loss';
		} else {
			outcome = match.winner_id === match.white_id ? 'win' : 'loss';
		}
	}

	const rawMode = (match.mode || 'blitz').toLowerCase();
	const isBullet = rawMode.startsWith('bullet');
	const isBlitz = rawMode.startsWith('blitz');
	const isRapid = rawMode.startsWith('rapid');

	const modeClass = isBullet
		? styles.modeBullet
		: isBlitz
		? styles.modeBlitz
		: isRapid
		? styles.modeRapid
		: styles.modeDefault;

	return (
		<div
			className={styles.simpleGameRow}
			onClick={() => onSelect(match)}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onSelect(match);
				}
			}}
		>
			{/* 1. Game Mode */}
			<div className={styles.modeCol}>
				<span className={styles.modeIcon}>
					<GameModeIcon mode={match.mode} size={16} />
				</span>
				<span className={`${styles.modeName} ${modeClass}`}>
					{t(rawMode, match.mode)}
				</span>
			</div>

			{/* 2. Players Column */}
			<div className={styles.playersCol}>
				{/* White Player */}
				<div className={styles.playerRow}>
					<img
						src={getAvatarUrl(whitePlayer?.avatar)}
						alt={whitePlayer?.username || t('white')}
						className={styles.playerAvatar}
						onError={(e) => {
							const target = e.currentTarget;
							if (!target.src.endsWith('/assets/default.jpg')) {
								target.src = '/assets/default.jpg';
							}
						}}
					/>
					<span
						className={`${styles.colorSquare} ${styles.squareWhite}`}
						title={t('white')}
					/>
					<span className={`${styles.playerName} ${isUserWhite ? styles.currentUser : ''}`}>
						{whitePlayer?.username || t('unknown')}
					</span>
					{whiteRating !== null && whiteRating !== undefined && (
						<span className={styles.playerRating}>({whiteRating})</span>
					)}
				</div>

				{/* Black Player */}
				<div className={styles.playerRow}>
					<img
						src={getAvatarUrl(blackPlayer?.avatar)}
						alt={blackPlayer?.username || t('black')}
						className={styles.playerAvatar}
						onError={(e) => {
							const target = e.currentTarget;
							if (!target.src.endsWith('/assets/default.jpg')) {
								target.src = '/assets/default.jpg';
							}
						}}
					/>
					<span
						className={`${styles.colorSquare} ${styles.squareBlack}`}
						title={t('black')}
					/>
					<span className={`${styles.playerName} ${isUserBlack ? styles.currentUser : ''}`}>
						{blackPlayer?.username || t('unknown')}
					</span>
					{blackRating !== null && blackRating !== undefined && (
						<span className={styles.playerRating}>({blackRating})</span>
					)}
				</div>
			</div>

			{/* 3. Result Badge */}
			<div className={styles.resultCol}>
				<span
					className={`${styles.resultText} ${
						outcome === 'win'
							? styles.resultWin
							: outcome === 'loss'
							? styles.resultLoss
							: styles.resultDraw
					}`}
				>
					{outcome === 'win'
						? t('win')
						: outcome === 'loss'
						? t('loss')
						: t('draw')}
				</span>
			</div>
		</div>
	);
}

