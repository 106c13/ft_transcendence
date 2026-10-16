import MoveClassificationIcon from '../MoveClassificationIcon/MoveClassificationIcon'
import styles from './BoardClassificationBadge.module.css'

type Props = {
	classification: string
	isExiting?: boolean
	title?: string
}

function BoardClassificationBadge({ classification, isExiting = false, title }: Props) {
	return (
		<div
			className={`${styles.badge} ${styles[`badge_${classification}`] || styles.badge_default} ${isExiting ? styles.badgeExit : styles.badgeEnter}`}
			title={title ?? classification}
		>
			<MoveClassificationIcon classification={classification} size={34} className={styles.badgeIcon} />
		</div>
	)
}

export default BoardClassificationBadge
