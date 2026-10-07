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
	movesCount?: number
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
	movesCount,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [showResignModal, setShowResignModal] = useState(false)
	const resignContainerRef = useRef<HTMLDivElement>(null)
	const isAbandon = (movesCount ?? 0) < 2

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
						👁️ {t('viewer_mode_desc')}
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
								🔍 {t('analyze_game')}
							</button>
						)}
						<button
							type="button"
							className={styles.lobbyBtn}
							onClick={() => navigate('/home')}
						>
							🏠 {t('back_to_lobby')}
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
					🔍 {t('analyze_game')}
				</button>
				<button
					type="button"
					className={styles.lobbyBtn}
					onClick={() => navigate('/home')}
				>
					🏠 {t('back_to_lobby')}
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
							✓ {t('accept_draw')}
						</button>
						<button type="button" className={styles.declineBtn} onClick={onDeclineDraw}>
							✕ {t('decline_draw')}
						</button>
					</>
				) : drawOfferState === 'sent' ? (
					<button type="button" className={`${styles.drawBtn} ${styles.drawBtnDisabled}`} disabled>
						⏳ {t('draw_offered')}
					</button>
				) : (
					<button type="button" className={styles.drawBtn} onClick={onOfferDraw}>
						½ {t('offer_draw')}
					</button>
				)}
				<div className={styles.resignContainer} ref={resignContainerRef}>
					<button
						type="button"
						className={`${styles.resignBtn} ${isAbandon ? styles.abandonBtn : ''} ${showResignModal ? (isAbandon ? styles.abandonBtnActive : styles.resignBtnActive) : ''}`}
						onClick={() => setShowResignModal((prev) => !prev)}
						aria-expanded={showResignModal}
					>
						{isAbandon ? `🚫 ${t('abandon')}` : `🏳️ ${t('resign')}`}
					</button>

					{showResignModal && (
						<div
							className={`${styles.resignModal} ${isAbandon ? styles.abandonModal : ''}`}
							role="dialog"
							aria-label={isAbandon ? t('confirm_abandon_short') : t('confirm_resign_short')}
						>
							<span className={styles.modalPrompt}>
								{isAbandon ? t('confirm_abandon_short') : t('confirm_resign_short')}
							</span>
							<div className={styles.modalButtons}>
								<button
									type="button"
									className={styles.modalCancelBtn}
									onClick={() => setShowResignModal(false)}
								>
									{t('cancel_action')}
								</button>
								<button
									type="button"
									className={`${styles.modalResignBtn} ${isAbandon ? styles.modalAbandonBtn : ''}`}
									onClick={() => {
										setShowResignModal(false)
										onResign()
									}}
								>
									{isAbandon ? `🚫 ${t('abandon')}` : `🏳️ ${t('resign')}`}
								</button>
							</div>
							{/* Pointer pointing right at the center of the original button */}
							<div className={`${styles.modalPointer} ${isAbandon ? styles.abandonModalPointer : ''}`} />
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default GameActions
