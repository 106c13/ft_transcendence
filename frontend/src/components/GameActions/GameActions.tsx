import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { DrawOfferState } from '../../hooks/useGameSocket'
import styles from './GameActions.module.css'

type Props = {
	isGameOver: boolean
	onResign: () => void
	drawOfferState: DrawOfferState
	onOfferDraw: () => void
	onAcceptDraw: () => void
	onDeclineDraw: () => void
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
					className={styles.analyzeBtn}
					onClick={onAnalyze}
				>
					🔍 {t('analyze_game', 'Analyze Game')}
				</button>
				<button
					className={styles.lobbyBtn}
					onClick={() => navigate('/home')}
				>
					🏠 {t('back_to_lobby', 'Back to Lobby')}
				</button>
			</div>
		)
	}

	if (drawOfferState === 'received') {
		return (
			<div className={styles.gameActions}>
				<div className={styles.drawOfferBox}>
					<div className={styles.drawOfferPrompt}>
						🤝 {t('opponent_offered_draw', 'Opponent offers a draw')}
					</div>
					<div className={styles.drawDecisionRow}>
						<button className={styles.acceptBtn} onClick={onAcceptDraw}>
							✓ {t('accept_draw', 'Accept')}
						</button>
						<button className={styles.declineBtn} onClick={onDeclineDraw}>
							✕ {t('decline_draw', 'Decline')}
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.gameActions}>
			{drawOfferState === 'declined' && (
				<div className={styles.declinedNotice}>
					✕ {t('draw_declined', 'Opponent declined draw offer')}
				</div>
			)}
			<div className={styles.actionRow}>
				{drawOfferState === 'sent' ? (
					<button className={`${styles.drawBtn} ${styles.drawBtnDisabled}`} disabled>
						⏳ {t('draw_offered', 'Draw Offered...')}
					</button>
				) : (
					<button className={styles.drawBtn} onClick={onOfferDraw}>
						½ {t('offer_draw', 'Offer Draw')}
					</button>
				)}
				<button className={styles.resignBtn} onClick={onResign}>
					🏳️ {t('resign', 'Resign')}
				</button>
			</div>
		</div>
	)
}

export default GameActions
