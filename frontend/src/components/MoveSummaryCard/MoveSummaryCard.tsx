import MoveClassificationIcon from '../MoveClassificationIcon/MoveClassificationIcon'
import styles from './MoveSummaryCard.module.css'

type Props = {
	classification?: string
	count?: number
	label?: string
	loading?: boolean
}

function MoveSummaryCard({ classification, count, label, loading = false }: Props) {
	const cardClassName = classification
		? `${styles.card} ${styles[`stat_${classification}`]}`
		: `${styles.card} ${styles.loadingCard}`

	return (
		<div
			className={cardClassName}
			aria-label={loading ? 'Analyzing game' : label}
			aria-busy={loading}
		>
			{loading ? (
				<>
					<span className={styles.topRow}>
						<span className={styles.skeletonIcon} />
						<span className={styles.skeletonCount} />
					</span>
					<span className={styles.skeletonLabel} />
				</>
			) : (
				<>
					<span className={styles.topRow}>
						<MoveClassificationIcon classification={classification!} size={34} withBackground />
						<span className={styles.count}>{count}</span>
					</span>
					<span className={styles.label}>{label}</span>
				</>
			)}
		</div>
	)
}

export default MoveSummaryCard
