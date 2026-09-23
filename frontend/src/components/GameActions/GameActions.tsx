import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { DrawOfferState } from '../../hooks/useGameSocket'
import styles from './GameActions.module.css'

type Props = {
	isGameOver: boolean
	onResign: () => void
	drawOfferState: DrawOfferState
	onOfferDraw: () => void
	onAcceptDraw?: () => void
	onDeclineDraw?: () => void
	onAnalyze?: () => void
}

function GameActions({
	isGameOver,
	onResign,
	drawOfferState,
	onOfferDraw,
	onAcceptDraw,
	onDeclineDraw,
	onAnalyze,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	if (isGameOver) {
		return (
			<div className={styles.gameActions}>
				<button
					type="button"
					className={styles.analyzeBtn}
					onClick={onAnalyze}
				>
					🔍 {t('analyze_game', 'Analyze Game')}
				</button>
				<button
					type="button"
					className={styles.lobbyBtn}
					onClick={() => navigate('/home')}
				>
					🏠 {t('back_to_lobby', 'Back to Lobby')}
				</button>
			</div>
		)
	}

	return (
		<div className={styles.gameActions}>
			<div className={styles.actionRow}>
				{drawOfferState === 'received' ? (
					<>
						<button type="button" className={styles.acceptBtn} onClick={onAcceptDraw}>
							✓ {t('accept_draw', 'Accept')}
						</button>
						<button type="button" className={styles.declineBtn} onClick={onDeclineDraw}>
							✕ {t('decline_draw', 'Decline')}
						</button>
					</>
				) : drawOfferState === 'sent' ? (
					<button type="button" className={`${styles.drawBtn} ${styles.drawBtnDisabled}`} disabled>
						⏳ {t('draw_offered', 'Draw Offered...')}
					</button>
				) : (
					<button type="button" className={styles.drawBtn} onClick={onOfferDraw}>
						½ {t('offer_draw', 'Offer Draw')}
					</button>
				)}
				<button type="button" className={styles.resignBtn} onClick={onResign}>
					🏳️ {t('resign', 'Resign')}
				</button>
			</div>
		</div>
	)
}

export default GameActions
