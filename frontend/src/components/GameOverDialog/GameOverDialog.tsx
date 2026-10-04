import { useTranslation } from 'react-i18next'
import styles from './GameOverDialog.module.css'

type Props = {
	winnerColor: 'w' | 'b' | null
	playerColor: 'w' | 'b'
	gameOverReason: string
	ratingAfter?: number | null
	ratingDelta?: number | null
	onClose: () => void
	onPlayAgain: () => void
	rematchState?: 'idle' | 'sent'
	onRematch: () => void
	onAnalyze?: () => void
}

function GameOverDialog({
	winnerColor, playerColor, gameOverReason, ratingAfter, ratingDelta, onClose, onPlayAgain,
	rematchState = 'idle', onRematch, onAnalyze
}: Props) {
	const { t } = useTranslation()
	const isWaiting = rematchState === 'sent'

	return (
		<div className={styles.gameOverModal}>
			<div className={styles.gameOverBox}>
				<button className={styles.closeModalX} onClick={onClose} aria-label={t('close', 'Close')}>✕</button>
				<div className={styles.gameOverIcon}>
					{gameOverReason === 'ABANDONED'
						? '🚫'
						: winnerColor === playerColor
						? '🏆'
						: winnerColor === null
						? '🤝'
						: '💀'}
				</div>
				<h2>{t('game_over', 'Game Over')}</h2>
				<div className={styles.gameOverResult}>
					{gameOverReason === 'ABANDONED'
						? t('reason_abandoned', 'Game Abandoned')
						: winnerColor === playerColor
						? t('victory', 'Victory!')
						: winnerColor === null
						? t('draw', 'Draw')
						: t('defeat', 'Defeat')}
				</div>
				<div className={styles.gameOverReason}>
					{gameOverReason === 'ABANDONED' && t('reason_abandoned_desc', 'Game was abandoned before both players made a move')}
					{gameOverReason === 'CHECKMATE' && t('reason_checkmate', 'Checkmate')}
					{gameOverReason === 'STALEMATE' && t('reason_stalemate', 'Stalemate')}
					{gameOverReason === 'TIMEOUT' && t('reason_timeout', 'Time Out')}
					{gameOverReason === 'RESIGNATION' && t('reason_resignation', 'Resigned')}
					{gameOverReason === 'DISCONNECTION' && t('reason_disconnection', 'Opponent Disconnected')}
					{gameOverReason === 'DRAW' && t('reason_draw', 'Draw')}
				</div>
				{gameOverReason !== 'ABANDONED' && ratingAfter !== undefined && ratingAfter !== null && (
					<div className={styles.ratingSection}>
						<span className={styles.ratingLabel}>{t('rating', 'Rating')}:</span>
						<span className={styles.ratingValue}>{ratingAfter}</span>
						{ratingDelta !== undefined && ratingDelta !== null && (
							<span
								className={`${styles.ratingDelta} ${
									ratingDelta > 0
										? styles.ratingGain
										: ratingDelta < 0
										? styles.ratingLoss
										: styles.ratingEven
								}`}
							>
								{ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta}
							</span>
						)}
					</div>
				)}
				<div className={styles.buttonRow}>
					<button className={styles.playAgainBtn} onClick={onPlayAgain}>
						{t('play_again', 'Play Again')}
					</button>
					{gameOverReason !== 'ABANDONED' && (
						<button
							className={`${styles.rematchBtn} ${isWaiting ? styles.rematchBtnDisabled : ''}`}
							onClick={onRematch}
							disabled={isWaiting}
						>
							{isWaiting ? t('rematch_waiting', 'Waiting...') : t('rematch', 'Rematch')}
						</button>
					)}
				</div>
				{gameOverReason !== 'ABANDONED' && onAnalyze && (
					<button className={styles.analyzeBtn} onClick={onAnalyze}>
						🔍 {t('analyze_game', 'Analyze Game')}
					</button>
				)}
			</div>
		</div>
	)
}

export default GameOverDialog