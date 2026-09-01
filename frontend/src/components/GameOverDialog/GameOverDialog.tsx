import { useTranslation } from 'react-i18next'
import styles from './GameOverDialog.module.css'

type Props = {
	winnerColor: 'w' | 'b' | null
	playerColor: 'w' | 'b'
	gameOverReason: string
	onClose: () => void
	onPlayAgain: () => void
}

function GameOverDialog({ winnerColor, playerColor, gameOverReason, onClose, onPlayAgain }: Props) {
	const { t } = useTranslation()

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
				<button className={styles.playAgainBtn} onClick={onPlayAgain}>
					{t('play_again', 'Play Again')}
				</button>
			</div>
		</div>
	)
}

export default GameOverDialog