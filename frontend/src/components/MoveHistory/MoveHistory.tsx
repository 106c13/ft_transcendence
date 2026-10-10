import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollText, SkipBack, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import styles from './MoveHistory.module.css';


type Props = {
	moveHistory: string[]
	moveSAN: string[]
	moveTimes?: number[]
	viewIndex: number
	isReviewing: boolean
	onSelectIndex: (idx: number) => void
}

function formatMoveTime(ms?: number): string {
	if (ms === undefined || ms === null) return '—'
	const totalSec = ms / 1000
	if (totalSec < 60) {
		return `${totalSec.toFixed(1)}s`
	}
	const mins = Math.floor(totalSec / 60)
	const secs = Math.floor(totalSec % 60)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

function MoveHistory({
	moveHistory,
	moveSAN,
	moveTimes,
	viewIndex,
	isReviewing: _isReviewing,
	onSelectIndex,
}: Props) {
	const { t } = useTranslation()
	const moveListRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = moveListRef.current
		if (!container) return

		const active = container.querySelector(`.${styles.moveBtn}.${styles.activeMove}`) as HTMLElement | null
		if (!active) return

		// Scroll ONLY the moveListRef container, never the browser window or parent page
		const containerRect = container.getBoundingClientRect()
		const activeRect = active.getBoundingClientRect()

		const relativeTop = activeRect.top - containerRect.top + container.scrollTop
		const relativeBottom = relativeTop + activeRect.height

		const currentScroll = container.scrollTop
		const viewHeight = container.clientHeight

		if (relativeTop < currentScroll) {
			container.scrollTo({ top: Math.max(0, relativeTop - 4), behavior: 'smooth' })
		} else if (relativeBottom > currentScroll + viewHeight) {
			container.scrollTo({ top: relativeBottom - viewHeight + 4, behavior: 'smooth' })
		}
	}, [viewIndex])

	const halfMoves = moveHistory.length - 1
	const rows = []
	for (let i = 0; i < halfMoves; i += 2) {
		rows.push({
			num: Math.floor(i / 2) + 1,
			whiteIdx: i,
			blackIdx: i + 1,
			whiteSan: moveSAN[i] ?? '',
			blackSan: moveSAN[i + 1] ?? '',
			whiteTime: moveTimes?.[i],
			blackTime: moveTimes?.[i + 1],
		})
	}

	return (
		<div className={styles.moveHistoryRoot}>
			<div className={styles.moveHistoryHeader}>
				<span className={styles.moveHistoryTitle}>{t('move_history')}</span>
			</div>

			<div className={styles.moveHistoryList} ref={moveListRef}>
				{rows.length === 0 ? (
					<div className={styles.emptyHistory}>
						<div className={styles.emptyHistoryIcon}>
							<ScrollText size={36} aria-hidden="true" />
						</div>
						<span className={styles.emptyHistoryTitle}>
							{t('no_moves_yet')}
						</span>
						<span className={styles.emptyHistorySubtitle}>
							{t('moves_appear_here')}
						</span>
					</div>
				) : (
					rows.map(row => {
						const whiteActive = viewIndex === row.whiteIdx + 1
						const blackActive = viewIndex === row.blackIdx + 1

						return (
							<div key={row.num} className={styles.moveRow}>
								<span className={styles.moveRowNum}>{row.num}.</span>

								<button
									type="button"
									className={`${styles.moveBtn} ${whiteActive ? styles.activeMove : ''}`}
									onClick={() => onSelectIndex(row.whiteIdx + 1)}
								>
									{row.whiteSan}
								</button>

								{row.blackSan ? (
									<button
										type="button"
										className={`${styles.moveBtn} ${blackActive ? styles.activeMove : ''}`}
										onClick={() => onSelectIndex(row.blackIdx + 1)}
									>
										{row.blackSan}
									</button>
								) : (
									<span className={styles.emptyMoveBtn} />
								)}

								<div className={styles.moveTimesGroup}>
									<div className={styles.timeItem} title={t('white_time_spent')}>
										<span className={styles.timeDotWhite} />
										<span className={styles.timeText}>{formatMoveTime(row.whiteTime)}</span>
									</div>
									{row.blackSan ? (
										<div className={styles.timeItem} title={t('black_time_spent')}>
											<span className={styles.timeDotBlack} />
											<span className={styles.timeText}>{formatMoveTime(row.blackTime)}</span>
										</div>
									) : (
										<div className={styles.timeItemPlaceholder} />
									)}
								</div>
							</div>
						)
					})
				)}
			</div>

			<div className={styles.moveNavRow}>
				<button
					type="button"
					className={styles.navBtn}
					title={t('start')}
					disabled={halfMoves <= 0}
					onClick={() => onSelectIndex(0)}
				>
					<SkipBack size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={styles.navBtn}
					title={t('previous')}
					disabled={halfMoves <= 0}
					onClick={() => onSelectIndex(Math.max(0, viewIndex - 1))}
				>
					<ChevronLeft size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={styles.navBtn}
					title={t('next')}
					disabled={halfMoves <= 0}
					onClick={() => onSelectIndex(Math.min(moveHistory.length - 1, viewIndex + 1))}
				>
					<ChevronRight size={14} aria-hidden="true" />
				</button>
				<button
					type="button"
					className={styles.navBtn}
					title={t('latest')}
					disabled={halfMoves <= 0}
					onClick={() => onSelectIndex(moveHistory.length - 1)}
				>
					<SkipForward size={14} aria-hidden="true" />
				</button>
			</div>
		</div>
	);
};

export default MoveHistory;

