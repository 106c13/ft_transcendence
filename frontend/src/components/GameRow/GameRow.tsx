import { useTranslation } from 'react-i18next'
import type { MatchRecord } from '../GameAnalysis/GameAnalysis'
import styles from './GameRow.module.css'

type Props = {
	match: MatchRecord
	username: string
	onSelect: (match: MatchRecord) => void
}

export default function GameRow({ match, username, onSelect }: Props) {
	const { t } = useTranslation()

	const isWhite = match.white?.username === username
	const opponent = isWhite ? match.black : match.white
	const delta = isWhite ? match.white_rating_delta : match.black_rating_delta
	const oppRating = isWhite ? match.black_rating_after : match.white_rating_after

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
		<div
			className={styles.gameRow}
			onClick={() => onSelect(match)}
			role="button"
			tabIndex={0}
		>
			{/* Opponent Info */}
			<div className={styles.opponentCol}>
				<img
					src={opponent?.avatar ? `/uploads/${opponent.avatar}` : '/assets/default.jpg'}
					alt={opponent?.username || 'Opponent'}
					className={styles.opponentAvatar}
				/>
				<div className={styles.opponentInfo}>
					<span className={styles.opponentName}>{opponent?.username || 'Unknown'}</span>
					{oppRating !== null && oppRating !== undefined && (
						<span className={styles.opponentRating}>{oppRating}</span>
					)}
				</div>
			</div>

			{/* Color */}
			<div className={styles.colorCol}>
				<span
					className={`${styles.colorBadge} ${
						isWhite ? styles.colorWhite : styles.colorBlack
					}`}
				>
					<span className={styles.pieceIcon}>{isWhite ? '⚪' : '⚫'}</span>
					<span>{isWhite ? t('white', 'White') : t('black', 'Black')}</span>
				</span>
			</div>

			{/* Date Played */}
			<div className={styles.dateCol}>
				<span className={styles.dateFull}>{dateStr}</span>
				{timeStr && <span className={styles.dateSub}>{timeStr}</span>}
			</div>

			{/* Game Mode - DISTINCT NEUTRAL COLOR, NOT CONFLICTING WITH WIN/LOSS */}
			<div className={styles.modeCol}>
				<span className={`${styles.modeBadge} ${modeClass}`}>
					<span>{modeIcon}</span>
					<span>{match.mode}</span>
				</span>
			</div>

			{/* Result */}
			<div className={styles.resultCol}>
				<span
					className={`${styles.resultBadge} ${
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

				{delta !== null && delta !== undefined && (
					<span
						className={`${styles.deltaBadge} ${
							delta > 0
								? styles.deltaPos
								: delta < 0
								? styles.deltaNeg
								: styles.deltaZero
						}`}
					>
						{delta > 0 ? `+${delta}` : delta}
					</span>
				)}
			</div>

			{/* Arrow Indicator */}
			<div className={styles.arrowCol}>
				<span>→</span>
			</div>
		</div>
	)
}

