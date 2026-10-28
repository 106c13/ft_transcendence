import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollText, Play, Pause, SkipBack, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { MOVE_STEPS } from '../../utils/aboutUtils';
import styles from './AboutMoveLog.module.css';

interface Props {
	currentPly: number;
	onSelectPly: (ply: number) => void;
	isPlaying: boolean;
	onTogglePlay: () => void;
}

const AboutMoveLog = ({
	currentPly,
	onSelectPly,
	isPlaying,
	onTogglePlay,
}: Props) => {
	const { t } = useTranslation();
	const listRef = useRef<HTMLDivElement>(null)

	// Keep active move visible in vertical list
	useEffect(() => {
		const container = listRef.current
		if (!container) return

		const activeEl = container.querySelector(`.${styles.activeMove}`) as HTMLElement | null
		if (!activeEl) return

		const containerRect = container.getBoundingClientRect()
		const activeRect = activeEl.getBoundingClientRect()

		const relativeTop = activeRect.top - containerRect.top + container.scrollTop
		const relativeBottom = relativeTop + activeRect.height

		const currentScroll = container.scrollTop
		const viewHeight = container.clientHeight

		if (relativeTop < currentScroll) {
			container.scrollTo({ top: Math.max(0, relativeTop - 6), behavior: 'smooth' })
		} else if (relativeBottom > currentScroll + viewHeight) {
			container.scrollTo({ top: relativeBottom - viewHeight + 6, behavior: 'smooth' })
		}
	}, [currentPly])

	const maxPly = MOVE_STEPS.length - 1

	return (
		<div className={styles.moveLogRoot}>
			{/* Header */}
			<div className={styles.header}>
				<h4 className={styles.title}>
					<ScrollText size={16} aria-hidden="true" />
					<span>{t('about_move_history')}</span>
				</h4>
			</div>

			{/* Vertical Moves Table */}
			<div className={styles.movesList} ref={listRef}>
				{/* Starting Position Row */}
				<button
					type="button"
					className={`${styles.startRow} ${currentPly === 0 ? styles.activeMove : ''}`}
					onClick={() => onSelectPly(0)}
				>
					{t('about_start_position')}
				</button>

				{/* Move 1: Kd1 Kg1 */}
				<div className={styles.moveRow}>
					<span className={styles.moveRowNum}>1.</span>
					<button
						type="button"
						className={`${styles.moveBtn} ${currentPly === 1 ? styles.activeMove : ''}`}
						onClick={() => onSelectPly(1)}
					>
						Kd1
					</button>
					<button
						type="button"
						className={`${styles.moveBtn} ${currentPly === 2 ? styles.activeMove : ''}`}
						onClick={() => onSelectPly(2)}
					>
						Kg1
					</button>
				</div>

				{/* Move 2: Ne3 Kh1 */}
				<div className={styles.moveRow}>
					<span className={styles.moveRowNum}>2.</span>
					<button
						type="button"
						className={`${styles.moveBtn} ${currentPly === 3 ? styles.activeMove : ''}`}
						onClick={() => onSelectPly(3)}
					>
						Ne3
					</button>
					<button
						type="button"
						className={`${styles.moveBtn} ${currentPly === 4 ? styles.activeMove : ''}`}
						onClick={() => onSelectPly(4)}
					>
						Kh1
					</button>
				</div>

				{/* Move 3: Qg2# */}
				<div className={styles.moveRow}>
					<span className={styles.moveRowNum}>3.</span>
					<button
						type="button"
						className={`${styles.moveBtn} ${currentPly === 5 ? styles.activeMove : ''}`}
						onClick={() => onSelectPly(5)}
					>
						Qg2#
					</button>
					<span className={styles.emptyCell}>—</span>
				</div>
			</div>

			{/* Navigation Buttons Row */}
			<div className={styles.navRow}>
				<button
					type="button"
					className={styles.navBtn}
					onClick={() => onSelectPly(0)}
					disabled={currentPly === 0}
					aria-label={t('about_aria_start_pos')}
				>
					<SkipBack size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={styles.navBtn}
					onClick={() => onSelectPly(Math.max(0, currentPly - 1))}
					disabled={currentPly === 0}
					aria-label={t('about_aria_prev_move')}
				>
					<ChevronLeft size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={`${styles.navBtn} ${styles.playPauseBtn}`}
					onClick={onTogglePlay}
					aria-label={isPlaying ? t('about_aria_pause') : t('about_aria_play')}
				>
					{isPlaying ? (
						<Pause size={14} aria-hidden="true" />
					) : (
						<Play size={14} fill="currentColor" aria-hidden="true" />
					)}
				</button>
				<button
					type="button"
					className={styles.navBtn}
					onClick={() => onSelectPly(Math.min(maxPly, currentPly + 1))}
					disabled={currentPly === maxPly}
					aria-label={t('about_aria_next_move')}
				>
					<ChevronRight size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={styles.navBtn}
					onClick={() => onSelectPly(maxPly)}
					disabled={currentPly === maxPly}
					aria-label={t('about_aria_checkmate')}
				>
					<SkipForward size={14} aria-hidden="true" />
				</button>
			</div>
		</div>
	);
};

export default AboutMoveLog;
