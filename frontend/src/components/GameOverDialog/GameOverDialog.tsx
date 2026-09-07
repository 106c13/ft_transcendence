import { useTranslation } from 'react-i18next'
import styles from './GameOverDialog.module.css'

type RematchState = 'idle' | 'sent' | 'received' | 'declined' | 'opponent_left'

type Props = {
	winnerColor: 'w' | 'b' | null
	playerColor: 'w' | 'b'
	gameOverReason: string
	onClose: () => void
	onPlayAgain: () => void
	rematchState: RematchState
	onRematch: () => void
	onAcceptRematch: () => void
	onDeclineRematch: () => void
}

function GameOverDialog({
	winnerColor, playerColor, gameOverReason, onClose, onPlayAgain,
	rematchState, onRematch, onAcceptRematch, onDeclineRematch
}: Props) {
	const { t } = useTranslation()

	const renderRematchButton = () => {
		switch (rematchState) {
			case 'idle':
				return (
					<button className={styles.rematchBtn} onClick={onRematch}>
						{t('rematch', 'Rematch')}
					</button>
				)
			case 'sent':
				return (
					<button className={`${styles.rematchBtn} ${styles.rematchBtnDisabled}`} disabled>
						{t('rematch_waiting', 'Waiting...')}
					</button>
				)
			case 'received':
				return (
					<div className={styles.rematchReceivedRow}>
						<button className={styles.acceptRematchBtn} onClick={onAcceptRematch}>
							{t('accept_rematch', '✓ Accept')}
						</button>
						<button className={styles.declineRematchBtn} onClick={onDeclineRematch}>
							{t('decline_rematch', '✗ Decline')}
						</button>
					</div>
				)
			case 'declined':
				return (
					<button className={`${styles.rematchBtn} ${styles.rematchBtnDisabled}`} disabled>
						{t('rematch_declined', 'Declined')}
					</button>
				)
			case 'opponent_left':
				return (
					<button className={`${styles.rematchBtn} ${styles.rematchBtnDisabled}`} disabled title={t('opponent_left_hint', 'Opponent has left the game page')}>
						{t('opponent_left', 'Opponent Left')}
					</button>
				)
			default:
				return null
		}
	}

	return (
		<div className={styles.gameOverModal}>
			<div className={styles.gameOverBox}>
				<button className={styles.closeModalX} onClick={onClose}>✕</button>
				<div className={styles.gameOverIcon}>
					{winnerColor === playerColor ? '🏆' : winnerColor === null ? '🤝' : '💀'}
				</div>
				<h2>{t('game_over', 'Game Over')}</h2>
				<div className={styles.gameOverResult}>
					{winnerColor === playerColor ? t('victory', 'Victory!') : winnerColor === null ? t('draw', 'Draw') : t('defeat', 'Defeat')}
				</div>
				<div className={styles.gameOverReason}>
					{gameOverReason === 'CHECKMATE' && t('reason_checkmate', 'Checkmate')}
					{gameOverReason === 'STALEMATE' && t('reason_stalemate', 'Stalemate')}
					{gameOverReason === 'TIMEOUT' && t('reason_timeout', 'Time Out')}
					{gameOverReason === 'RESIGNATION' && t('reason_resignation', 'Resigned')}
					{gameOverReason === 'DISCONNECTION' && t('reason_disconnection', 'Opponent Disconnected')}
					{gameOverReason === 'DRAW' && t('reason_draw', 'Draw')}
				</div>
				<div className={styles.buttonRow}>
					<button className={styles.playAgainBtn} onClick={onPlayAgain}>
						{t('play_again', 'Play Again')}
					</button>
					{renderRematchButton()}
				</div>
			</div>
		</div>
	)
}

export default GameOverDialog