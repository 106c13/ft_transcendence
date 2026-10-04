import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { DrawOfferState } from '../../hooks/useGameSocket'
import styles from './GameActions.module.css'

type Props = {
	isGameOver: boolean
	isViewer?: boolean
	onResign: () => void
	drawOfferState: DrawOfferState
	onOfferDraw: () => void
	onAcceptDraw?: () => void
	onDeclineDraw?: () => void
	onAnalyze?: () => void
}

function GameActions({
	isGameOver,
	isViewer,
	onResign,
	drawOfferState,
	onOfferDraw,
	onAcceptDraw,
	onDeclineDraw,
	onAnalyze,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [showResignModal, setShowResignModal] = useState(false)
	const resignContainerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!showResignModal) return

		const handleClickOutside = (e: MouseEvent) => {
			if (resignContainerRef.current && !resignContainerRef.current.contains(e.target as Node)) {
				setShowResignModal(false)
			}
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setShowResignModal(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [showResignModal])

	useEffect(() => {
		if (isGameOver) {
			setShowResignModal(false)
		}
	}, [isGameOver])

	if (isViewer) {
		return (
			<div className={styles.gameActions}>
				{!isGameOver && (
					<div className={styles.viewerBadge}>
						👁️ {t('viewer_mode_desc', 'You are viewing this match live')}
					</div>
				)}
				{isGameOver && (
					<>
						{onAnalyze && (
							<button
								type="button"
								className={styles.analyzeBtn}
								onClick={onAnalyze}
							>
								🔍 {t('analyze_game', 'Analyze Game')}
							</button>
						)}
						<button
							type="button"
							className={styles.lobbyBtn}
							onClick={() => navigate('/home')}
						>
							🏠 {t('back_to_lobby', 'Back to Lobby')}
						</button>
					</>
				)}
			</div>
		)
	}

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
				<div className={styles.resignContainer} ref={resignContainerRef}>
					<button
						type="button"
						className={`${styles.resignBtn} ${showResignModal ? styles.resignBtnActive : ''}`}
						onClick={() => setShowResignModal((prev) => !prev)}
						aria-expanded={showResignModal}
					>
						🏳️ {t('resign', 'Resign')}
					</button>

					{showResignModal && (
						<div
							className={styles.resignModal}
							role="dialog"
							aria-label={t('confirm_resign_short', 'Resign game?')}
						>
							<span className={styles.modalPrompt}>
								{t('confirm_resign_short', 'Resign game?')}
							</span>
							<div className={styles.modalButtons}>
								<button
									type="button"
									className={styles.modalCancelBtn}
									onClick={() => setShowResignModal(false)}
								>
									{t('cancel_action', 'Cancel')}
								</button>
								<button
									type="button"
									className={styles.modalResignBtn}
									onClick={() => {
										setShowResignModal(false)
										onResign()
									}}
								>
									🏳️ {t('resign', 'Resign')}
								</button>
							</div>
							{/* Pointer pointing right at the center of the original button */}
							<div className={styles.modalPointer} />
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default GameActions
