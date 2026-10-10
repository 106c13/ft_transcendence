import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Search, Check, X, Clock, Ban, Flag, Download, RotateCcw } from 'lucide-react';
import type { DrawOfferState } from '../../hooks/useGameSocket';
import styles from './GameActions.module.css';

type Props = {
	isGameOver: boolean;
	isViewer?: boolean;
	onResign: () => void;
	drawOfferState: DrawOfferState;
	onOfferDraw: () => void;
	onAcceptDraw?: () => void;
	onDeclineDraw?: () => void;
	onAnalyze?: () => void;
	onExportPgn?: () => void;
	onPlayAgain?: () => void;
	movesCount?: number;
};

const GameActions = ({
	isGameOver,
	isViewer,
	onResign,
	drawOfferState,
	onOfferDraw,
	onAcceptDraw,
	onDeclineDraw,
	onAnalyze,
	onExportPgn,
	onPlayAgain,
	movesCount,
}: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [showResignModal, setShowResignModal] = useState(false)
	const resignContainerRef = useRef<HTMLDivElement>(null)
	const isAbandon = (movesCount ?? 0) < 2

	const handlePlayAgain = () => {
		if (onPlayAgain) {
			onPlayAgain();
		} else {
			navigate('/game');
		}
	};

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
						<Eye size={16} aria-hidden="true" />
						<span>{t('viewer_mode_desc')}</span>
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
								<Search size={15} aria-hidden="true" />
								<span>{t('analyze_game')}</span>
							</button>
						)}
						{onExportPgn && (
							<button
								type="button"
								className={styles.exportPgnBtn}
								onClick={onExportPgn}
							>
								<Download size={15} aria-hidden="true" />
								<span>{t('export_pgn')}</span>
							</button>
						)}
						<button
							type="button"
							className={styles.playAgainBtn}
							onClick={handlePlayAgain}
						>
							<RotateCcw size={15} aria-hidden="true" />
							<span>{t('play_again')}</span>
						</button>
					</>
				)}
			</div>
		);
	}

	if (isGameOver) {
		return (
			<div className={styles.gameActions}>
				{onAnalyze && (
					<button
						type="button"
						className={styles.analyzeBtn}
						onClick={onAnalyze}
					>
						<Search size={15} aria-hidden="true" />
						<span>{t('analyze_game')}</span>
					</button>
				)}
				{onExportPgn && (
					<button
						type="button"
						className={styles.exportPgnBtn}
						onClick={onExportPgn}
					>
						<Download size={15} aria-hidden="true" />
						<span>{t('export_pgn')}</span>
					</button>
				)}
				<button
					type="button"
					className={styles.playAgainBtn}
					onClick={handlePlayAgain}
				>
					<RotateCcw size={15} aria-hidden="true" />
					<span>{t('play_again')}</span>
				</button>
			</div>
		);
	}

	return (
		<div className={styles.gameActions}>
			<div className={styles.actionRow}>
				{drawOfferState === 'received' ? (
					<>
						<button type="button" className={styles.acceptBtn} onClick={onAcceptDraw}>
							<Check size={14} aria-hidden="true" />
							<span>{t('accept_draw')}</span>
						</button>
						<button type="button" className={styles.declineBtn} onClick={onDeclineDraw}>
							<X size={14} aria-hidden="true" />
							<span>{t('decline_draw')}</span>
						</button>
					</>
				) : drawOfferState === 'sent' ? (
					<button type="button" className={`${styles.drawBtn} ${styles.drawBtnDisabled}`} disabled>
						<Clock size={14} aria-hidden="true" />
						<span>{t('draw_offered')}</span>
					</button>
				) : (
					<button type="button" className={styles.drawBtn} onClick={onOfferDraw}>
						<span>½</span>
						<span>{t('offer_draw')}</span>
					</button>
				)}
				<div className={styles.resignContainer} ref={resignContainerRef}>
					<button
						type="button"
						className={`${styles.resignBtn} ${isAbandon ? styles.abandonBtn : ''} ${showResignModal ? (isAbandon ? styles.abandonBtnActive : styles.resignBtnActive) : ''}`}
						onClick={() => setShowResignModal((prev) => !prev)}
						aria-expanded={showResignModal}
					>
						{isAbandon ? (
							<>
								<Ban size={14} aria-hidden="true" />
								<span>{t('abandon')}</span>
							</>
						) : (
							<>
								<Flag size={14} aria-hidden="true" />
								<span>{t('resign')}</span>
							</>
						)}
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
										setShowResignModal(false);
										onResign();
									}}
								>
									{isAbandon ? (
										<>
											<Ban size={14} aria-hidden="true" />
											<span>{t('abandon')}</span>
										</>
									) : (
										<>
											<Flag size={14} aria-hidden="true" />
											<span>{t('resign')}</span>
										</>
									)}
								</button>
							</div>
							{/* Pointer pointing right at the center of the original button */}
							<div className={`${styles.modalPointer} ${isAbandon ? styles.abandonModalPointer : ''}`} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default GameActions;
