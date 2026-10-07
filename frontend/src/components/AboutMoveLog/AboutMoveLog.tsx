import { useEffect, useRef } from 'react';
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
					<span>Move History</span>
				</h4>
				<span className={`${styles.statusBadge} ${isPlaying ? styles.playing : ''}`}>
					{isPlaying ? (
						<>
							<Play size={11} fill="currentColor" aria-hidden="true" />
							<span>Auto</span>
						</>
					) : (
						<>
							<Pause size={11} aria-hidden="true" />
							<span>Paused</span>
						</>
					)}
				</span>
			</div>

			{/* Vertical Moves Table */}
			<div className={styles.movesList} ref={listRef}>
				{/* Starting Position Row */}
				<button
					type="button"
					className={`${styles.startRow} ${currentPly === 0 ? styles.activeMove : ''}`}
					onClick={() => onSelectPly(0)}
				>
					Start Position
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
					title="Start Position (Down Arrow)"
				>
					<SkipBack size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={styles.navBtn}
					onClick={() => onSelectPly(Math.max(0, currentPly - 1))}
					disabled={currentPly === 0}
					title="Previous Move (Left Arrow)"
				>
					<ChevronLeft size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={`${styles.navBtn} ${styles.playPauseBtn}`}
					onClick={onTogglePlay}
					title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
				>
					{isPlaying ? (
						<>
							<Pause size={13} aria-hidden="true" />
							<span>Pause</span>
						</>
					) : (
						<>
							<Play size={13} fill="currentColor" aria-hidden="true" />
							<span>Play</span>
						</>
					)}
				</button>
				<button
					type="button"
					className={styles.navBtn}
					onClick={() => onSelectPly(Math.min(maxPly, currentPly + 1))}
					disabled={currentPly === maxPly}
					title="Next Move (Right Arrow)"
				>
					<ChevronRight size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={styles.navBtn}
					onClick={() => onSelectPly(maxPly)}
					disabled={currentPly === maxPly}
					title="Checkmate (Up Arrow)"
				>
					<SkipForward size={14} aria-hidden="true" />
				</button>
			</div>
		</div>
	);
};

export default AboutMoveLog;
