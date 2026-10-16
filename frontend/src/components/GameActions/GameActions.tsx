import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Search, Check, X, Clock, Ban, Flag, Download, FlipHorizontal2, RotateCcw } from 'lucide-react';
import type { DrawOfferState } from '../../hooks/useGameSocket';
import Tooltip from '../Tooltip/Tooltip';
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
	onFlipBoard?: () => void;
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
	onFlipBoard,
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
					<div className={styles.actionRow}>
						<div className={styles.viewerBadge}>
							<Eye size={16} aria-hidden="true" />
							<span>{t('viewer_mode_desc')}</span>
						</div>
						{onFlipBoard && (
							<Tooltip content={t('flip_board')} position="top" className={styles.actionTooltip}>
								<button
									type="button"
									className={styles.flipBoardBtn}
									onClick={onFlipBoard}
									aria-label={t('flip_board')}
								>
									<FlipHorizontal2 size={15} aria-hidden="true" />
								</button>
							</Tooltip>
						)}
					</div>
				)}
				{isGameOver && (
					<div className={styles.actionRow}>
						{onAnalyze && (
							<Tooltip content={t('analyze_game')} position="top" className={styles.actionTooltip}>
								<button
									type="button"
									className={styles.flipBoardBtn}
									onClick={onAnalyze}
									aria-label={t('analyze_game')}
								>
									<Search size={15} aria-hidden="true" />
								</button>
							</Tooltip>
						)}
						<Tooltip content={t('play_again')} position="top" className={styles.actionTooltip}>
							<button
								type="button"
								className={styles.flipBoardBtn}
								onClick={handlePlayAgain}
								aria-label={t('play_again')}
							>
								<RotateCcw size={15} aria-hidden="true" />
							</button>
						</Tooltip>
						{onFlipBoard && (
							<Tooltip content={t('flip_board')} position="top" className={styles.actionTooltip}>
								<button
									type="button"
									className={styles.flipBoardBtn}
									onClick={onFlipBoard}
									aria-label={t('flip_board')}
								>
									<FlipHorizontal2 size={15} aria-hidden="true" />
								</button>
							</Tooltip>
						)}
						{onExportPgn && (
							<Tooltip content={t('export_pgn')} position="top" className={styles.actionTooltip}>
								<button
									type="button"
									className={styles.flipBoardBtn}
									onClick={onExportPgn}
									aria-label={t('export_pgn')}
								>
									<Download size={15} aria-hidden="true" />
								</button>
							</Tooltip>
						)}
					</div>
				)}
			</div>
		);
	}

	if (isGameOver) {
		return (
			<div className={styles.gameActions}>
				<div
					className={`${styles.drawOfferNotice} ${drawOfferState === 'received' ? styles.drawOfferNoticeVisible : ''}`}
					aria-live="polite"
					aria-hidden={drawOfferState !== 'received'}
				>
					{t('opponent_offered_draw')}
				</div>
				<div className={styles.actionRow}>
					{onAnalyze && (
						<Tooltip content={t('analyze_game')} position="top" className={styles.actionTooltip}>
							<button
								type="button"
								className={styles.flipBoardBtn}
								onClick={onAnalyze}
								aria-label={t('analyze_game')}
							>
								<Search size={15} aria-hidden="true" />
							</button>
						</Tooltip>
					)}
					<Tooltip content={t('play_again')} position="top" className={styles.actionTooltip}>
						<button
							type="button"
							className={styles.flipBoardBtn}
							onClick={handlePlayAgain}
							aria-label={t('play_again')}
						>
							<RotateCcw size={15} aria-hidden="true" />
						</button>
					</Tooltip>
					{onFlipBoard && (
						<Tooltip content={t('flip_board')} position="top" className={styles.actionTooltip}>
							<button
								type="button"
								className={styles.flipBoardBtn}
								onClick={onFlipBoard}
								aria-label={t('flip_board')}
							>
								<FlipHorizontal2 size={15} aria-hidden="true" />
							</button>
						</Tooltip>
					)}
					{onExportPgn && (
						<Tooltip content={t('export_pgn')} position="top" className={styles.actionTooltip}>
							<button
								type="button"
								className={styles.flipBoardBtn}
								onClick={onExportPgn}
								aria-label={t('export_pgn')}
							>
								<Download size={15} aria-hidden="true" />
							</button>
						</Tooltip>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={styles.gameActions}>
			<div
				className={`${styles.drawOfferNotice} ${drawOfferState === 'received' ? styles.drawOfferNoticeVisible : ''}`}
				aria-live="polite"
				aria-hidden={drawOfferState !== 'received'}
			>
				{t('opponent_offered_draw')}
			</div>
			<div className={styles.actionRow}>
				{drawOfferState === 'received' ? (
					<>
						<Tooltip content={t('accept_draw')} position="top" className={styles.actionTooltip}>
							<button type="button" className={styles.acceptBtn} onClick={onAcceptDraw}>
								<Check size={14} aria-hidden="true" />
							</button>
						</Tooltip>
						<Tooltip content={t('decline_draw')} position="top" className={styles.actionTooltip}>
							<button type="button" className={styles.declineBtn} onClick={onDeclineDraw}>
								<X size={14} aria-hidden="true" />
							</button>
						</Tooltip>
					</>
				) : drawOfferState === 'sent' ? (
					<Tooltip content={t('draw_offered')} position="top" className={styles.actionTooltip}>
						<button type="button" className={`${styles.drawBtn} ${styles.drawBtnDisabled}`} disabled>
							<Clock size={14} aria-hidden="true" />
						</button>
					</Tooltip>
				) : (
					<Tooltip content={t('offer_draw')} position="top" className={styles.actionTooltip}>
						<button type="button" className={styles.drawBtn} onClick={onOfferDraw}>
							<span aria-hidden="true">½</span>
						</button>
					</Tooltip>
				)}
				<div className={styles.resignContainer} ref={resignContainerRef}>
					<Tooltip content={isAbandon ? t('abandon') : t('resign')} position="top" className={styles.actionTooltip}>
						<button
							type="button"
							className={`${styles.resignBtn} ${isAbandon ? styles.abandonBtn : ''} ${showResignModal ? (isAbandon ? styles.abandonBtnActive : styles.resignBtnActive) : ''}`}
							onClick={() => setShowResignModal((prev) => !prev)}
							aria-expanded={showResignModal}
						>
							{isAbandon ? (
								<>
									<Ban size={14} aria-hidden="true" />
								</>
							) : (
								<>
									<Flag size={14} aria-hidden="true" />
								</>
							)}
						</button>
					</Tooltip>

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
				{onFlipBoard && (
					<Tooltip content={t('flip_board')} position="top" className={styles.actionTooltip}>
						<button
							type="button"
							className={styles.flipBoardBtn}
							onClick={onFlipBoard}
							aria-label={t('flip_board')}
						>
							<FlipHorizontal2 size={15} aria-hidden="true" />
						</button>
					</Tooltip>
				)}
			</div>
		</div>
	);
};

export default GameActions;
