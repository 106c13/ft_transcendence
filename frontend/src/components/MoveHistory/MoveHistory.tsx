import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './MoveHistory.module.css'

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
	isReviewing,
	onSelectIndex,
}: Props) {
	const { t } = useTranslation()
	const moveListRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (moveListRef.current) {
			const active = moveListRef.current.querySelector(`.${styles.moveBtn}.${styles.activeMove}`)
			if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
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
				<span className={styles.moveHistoryTitle}>{t('move_history', 'Move Log')}</span>
			</div>

			<div className={styles.moveHistoryList} ref={moveListRef}>
				{rows.map(row => {
					const whiteActive = viewIndex === row.whiteIdx + 1
					const blackActive = viewIndex === row.blackIdx + 1

					return (
						<div key={row.num} className={styles.moveRow}>
							<div className={styles.moveLeftGroup}>
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
										className={`${styles.moveBtn} ${styles.blackMoveBtn} ${blackActive ? styles.activeMove : ''}`}
										onClick={() => onSelectIndex(row.blackIdx + 1)}
									>
										{row.blackSan}
									</button>
								) : (
									<span className={styles.emptyMoveBtn} />
								)}
							</div>

							<div className={styles.moveTimesGroup}>
								<div className={styles.timeItem} title={t('white_time_spent', "White's time spent")}>
									<span className={styles.timeDotWhite} />
									<span className={styles.timeText}>{formatMoveTime(row.whiteTime)}</span>
								</div>
								{row.blackSan ? (
									<div className={styles.timeItem} title={t('black_time_spent', "Black's time spent")}>
										<span className={styles.timeDotBlack} />
										<span className={styles.timeText}>{formatMoveTime(row.blackTime)}</span>
									</div>
								) : (
									<div className={styles.timeItemPlaceholder} />
								)}
							</div>
						</div>
					)
				})}
			</div>

			{isReviewing && (
				<div className={styles.reviewingBanner}>{t('reviewing_banner', '👁 Reviewing — not live')}</div>
			)}

			<div className={styles.moveNavRow}>
				<button
					type="button"
					className={styles.navBtn}
					title={t('start', 'Start')}
					onClick={() => onSelectIndex(0)}
				>
					⇤
				</button>
				<button
					type="button"
					className={styles.navBtn}
					title={t('previous', 'Previous')}
					onClick={() => onSelectIndex(Math.max(0, viewIndex - 1))}
				>
					◀
				</button>
				<button
					type="button"
					className={styles.navBtn}
					title={t('next', 'Next')}
					onClick={() => onSelectIndex(Math.min(moveHistory.length - 1, viewIndex + 1))}
				>
					▶
				</button>
				<button
					type="button"
					className={styles.navBtn}
					title={t('latest', 'Latest')}
					onClick={() => onSelectIndex(moveHistory.length - 1)}
				>
					⇥
				</button>
			</div>
		</div>
	)
}

export default MoveHistory
