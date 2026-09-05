import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './MoveHistory.module.css'

type Props = {
	moveHistory: string[]
	moveSAN: string[]
	viewIndex: number
	isReviewing: boolean
	onSelectIndex: (idx: number) => void
}

function MoveHistory({ moveHistory, moveSAN, viewIndex, isReviewing, onSelectIndex }: Props) {
	const { t } = useTranslation()
	const moveListRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (moveListRef.current) {
			const active = moveListRef.current.querySelector(`.${styles.moveCell}.${styles.activeMove}`)
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
		})
	}

	return (
		<div className={styles.moveHistoryContainer}>
			<div className={styles.moveHistoryHeader}>
				<span className={styles.moveHistoryTitle}>{t('move_history', 'Move Log')}</span>
				<div className={styles.moveNavArrows}>
					<button title="Start" onClick={() => onSelectIndex(0)}>⇤</button>
					<button title="Previous" onClick={() => onSelectIndex(Math.max(0, viewIndex - 1))}>◀</button>
					<button title="Next" onClick={() => onSelectIndex(Math.min(moveHistory.length - 1, viewIndex + 1))}>▶</button>
					<button title="Latest" onClick={() => onSelectIndex(moveHistory.length - 1)}>⇥</button>
				</div>
			</div>
			<div className={styles.moveHistoryList} ref={moveListRef}>
				{rows.map(row => {
					const whiteActive = viewIndex === row.whiteIdx + 1
					const blackActive = viewIndex === row.blackIdx + 1
					return (
						<>
							<span className={styles.moveRowNum} key={`num-${row.num}`}>{row.num}.</span>
							<span
								key={`w-${row.num}`}
								className={`${styles.moveCell}${whiteActive ? ` ${styles.activeMove}` : ''}`}
								onClick={() => onSelectIndex(row.whiteIdx + 1)}
							>
								{row.whiteSan}
							</span>
							<span
								key={`b-${row.num}`}
								className={`${styles.moveCell}${blackActive ? ` ${styles.activeMove}` : ''}${!row.blackSan ? ` ${styles.emptyCell}` : ''}`}
								onClick={() => row.blackSan && onSelectIndex(row.blackIdx + 1)}
							>
								{row.blackSan}
							</span>
						</>
					)
				})}
			</div>
			{isReviewing && (
				<div className={styles.reviewingBanner}>👁 Reviewing — not live</div>
			)}
		</div>
	)
}

export default MoveHistory
