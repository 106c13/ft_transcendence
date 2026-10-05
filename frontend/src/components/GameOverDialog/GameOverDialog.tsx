import { useTranslation } from 'react-i18next'
import ModalConfetti from '../ModalConfetti/ModalConfetti'
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
	isViewer?: boolean
	showConfetti?: boolean
	onConfettiComplete?: () => void
}

function GameOverDialog({
	winnerColor,
	playerColor,
	gameOverReason,
	ratingAfter,
	ratingDelta,
	onClose,
	onPlayAgain,
	rematchState = 'idle',
	onRematch,
	onAnalyze,
	isViewer = false,
	showConfetti = false,
	onConfettiComplete,
}: Props) {
	const { t } = useTranslation()
	const isWaiting = rematchState === 'sent'

	const getResultText = () => {
		if (gameOverReason === 'ABANDONED') return t('reason_abandoned', 'Game Abandoned')
		if (isViewer) {
			if (winnerColor === 'w') return t('white_won', 'White won')
			if (winnerColor === 'b') return t('black_won', 'Black won')
			return t('draw', 'Draw')
		}
		if (winnerColor === playerColor) return t('victory', 'Victory!')
		if (winnerColor === null) return t('draw', 'Draw')
		return t('defeat', 'Defeat')
	}

	const getReasonText = () => {
		switch (gameOverReason) {
			case 'ABANDONED':
				return t('reason_abandoned_desc', 'Game was abandoned before both players made a move')
			case 'CHECKMATE':
				return isViewer ? t('by_checkmate', 'By checkmate') : t('reason_checkmate', 'Checkmate')
			case 'STALEMATE':
				return isViewer ? t('by_stalemate', 'By stalemate') : t('reason_stalemate', 'Stalemate')
			case 'TIMEOUT':
				return isViewer ? t('by_timeout', 'By timeout') : t('reason_timeout', 'Time Out')
			case 'RESIGNATION':
				return isViewer ? t('by_resignation', 'By resignation') : t('reason_resignation', 'Resigned')
			case 'DISCONNECTION':
				return isViewer ? t('by_disconnection', 'By disconnection') : t('reason_disconnection', 'Opponent Disconnected')
			case 'DRAW':
				return isViewer ? t('by_draw', 'By agreement') : t('reason_draw', 'Draw')
			default:
				return gameOverReason ? `${t('by', 'By')} ${gameOverReason.toLowerCase()}` : ''
		}
	}

	return (
		<div className={styles.gameOverModal}>
			{showConfetti && <ModalConfetti onComplete={onConfettiComplete} />}

			<div className={styles.gameOverBox}>
				<button className={styles.closeModalX} onClick={onClose} aria-label={t('close', 'Close')}>✕</button>

				<div className={`${styles.modalBody} ${isViewer ? styles.modalBodyViewer : ''}`}>
					<div className={styles.resultHeader}>
						<h2 className={styles.gameOverTitle}>{t('game_over', 'Game Over')}</h2>
						<div className={styles.gameOverResult}>{getResultText()}</div>
						{getReasonText() && <div className={styles.gameOverReason}>{getReasonText()}</div>}
					</div>

					{/* Player Rating Section: borderless, big rating with colored delta at right aligned to top */}
					{!isViewer && gameOverReason !== 'ABANDONED' && (ratingDelta !== null || ratingAfter !== null) && (
						<div className={styles.ratingSection}>
							<div className={styles.ratingDisplay}>
								<span className={styles.bigRatingValue}>{ratingAfter ?? '—'}</span>
								{ratingDelta !== undefined && ratingDelta !== null && (
									<span
										className={`${styles.ratingDeltaInline} ${
											ratingDelta > 0
												? styles.deltaPositive
												: ratingDelta < 0
												? styles.deltaNegative
												: styles.deltaNeutral
										}`}
									>
										{ratingDelta > 0 ? `↑${ratingDelta}` : ratingDelta < 0 ? `↓${Math.abs(ratingDelta)}` : '0'}
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className={styles.modalFooter}>
					{isViewer ? (
						<button className={styles.reviewBtn} onClick={onClose}>
							{t('review_game', 'Review Game')}
						</button>
					) : (
						<>
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
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default GameOverDialog