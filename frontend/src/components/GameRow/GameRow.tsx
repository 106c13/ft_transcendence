import { useTranslation } from 'react-i18next'
import type { MatchRecord } from '../GameAnalysis/GameAnalysis'
import styles from './GameRow.module.css'

type Props = {
	match: MatchRecord
	username: string
	onSelect: (match: MatchRecord) => void
}

function getAvatarUrl(avatar?: string | null) {
	if (!avatar || avatar === 'default.jpg') {
		return '/assets/default.jpg'
	}
	if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
		return avatar
	}
	return `/uploads/${avatar}`
}

export default function GameRow({ match, username, onSelect }: Props) {
	const { t } = useTranslation()

	const isUserWhite = match.white?.username === username
	const isUserBlack = match.black?.username === username
	const isWhite = isUserWhite
	const whitePlayer = match.white
	const blackPlayer = match.black
	const whiteRating = match.white_rating_after
	const blackRating = match.black_rating_after

	// Determine result
	let outcome: 'win' | 'loss' | 'draw' = 'draw'
	if (match.winner_id) {
		outcome =
			(isWhite && match.winner_id === match.white_id) ||
			(!isWhite && match.winner_id === match.black_id)
				? 'win'
				: 'loss'
	}

	// Format date
	let dateStr = match.played_at
	let timeStr = ''
	try {
		const d = new Date(match.played_at)
		dateStr = d.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
		timeStr = d.toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
		})
	} catch {
		// fallback
	}

	// Mode badge details
	const rawMode = match.mode.toLowerCase()
	const isBullet = rawMode.startsWith('bullet')
	const isBlitz = rawMode.startsWith('blitz')
	const isRapid = rawMode.startsWith('rapid')

	const modeClass = isBullet
		? styles.modeBullet
		: isBlitz
		? styles.modeBlitz
		: isRapid
		? styles.modeRapid
		: styles.modeDefault

	const modeIcon = isBullet ? '🔥' : isBlitz ? '⚡' : isRapid ? '⏳' : '♟'

	return (
		<div className={styles.gameRow}>
			{/* 1. Game Mode (First) - Icon on top, mode name under icon */}
			<div className={styles.modeCol}>
				<span className={styles.modeIcon}>{modeIcon}</span>
				<span className={`${styles.modeName} ${modeClass}`}>{match.mode}</span>
			</div>

			{/* 2. Players Column (White on top, Black on bottom) */}
			<div className={styles.playersCol}>
				<div className={styles.playersWrapper}>
					{/* White Player (Always on top) */}
					<div className={styles.playerRow}>
						<img
							src={getAvatarUrl(whitePlayer?.avatar)}
							alt={whitePlayer?.username || 'White'}
							className={styles.playerAvatar}
							onError={(e) => {
								const target = e.currentTarget
								if (!target.src.endsWith('/assets/default.jpg')) {
									target.src = '/assets/default.jpg'
								}
							}}
						/>
						<span
							className={`${styles.colorSquare} ${styles.squareWhite}`}
							title={t('white', 'White')}
							aria-label={t('white', 'White')}
						/>
						<span className={`${styles.playerName} ${isUserWhite ? styles.currentUser : ''}`}>
							{whitePlayer?.username || 'Unknown'}
						</span>
						{whiteRating !== null && whiteRating !== undefined && (
							<span className={styles.playerRating}>({whiteRating})</span>
						)}
					</div>

					{/* Black Player (Always on bottom) */}
					<div className={styles.playerRow}>
						<img
							src={getAvatarUrl(blackPlayer?.avatar)}
							alt={blackPlayer?.username || 'Black'}
							className={styles.playerAvatar}
							onError={(e) => {
								const target = e.currentTarget
								if (!target.src.endsWith('/assets/default.jpg')) {
									target.src = '/assets/default.jpg'
								}
							}}
						/>
						<span
							className={`${styles.colorSquare} ${styles.squareBlack}`}
							title={t('black', 'Black')}
							aria-label={t('black', 'Black')}
						/>
						<span className={`${styles.playerName} ${isUserBlack ? styles.currentUser : ''}`}>
							{blackPlayer?.username || 'Unknown'}
						</span>
						{blackRating !== null && blackRating !== undefined && (
							<span className={styles.playerRating}>({blackRating})</span>
						)}
					</div>
				</div>
			</div>

			{/* 3. Result */}
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
						? t('win', 'WIN')
						: outcome === 'loss'
						? t('loss', 'LOSS')
						: t('draw', 'DRAW')}
				</span>
			</div>

			{/* 4. Review Column (To the left of Date column) */}
			<div className={styles.reviewCol}>
				<button
					type="button"
					className={styles.reviewBtn}
					onClick={() => onSelect(match)}
				>
					{t('review', 'Review')}
				</button>
			</div>

			{/* 5. Date Played (Moved to end of data columns) */}
			<div className={styles.dateCol}>
				<span className={styles.dateFull}>{dateStr}</span>
				{timeStr && <span className={styles.dateSub}>{timeStr}</span>}
			</div>
		</div>
	)
}
