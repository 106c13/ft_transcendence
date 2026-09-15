import styles from './GameMode.module.css'
import type { GameModeType } from '../../constants/gameModeConstats';
import { modeClassMap } from '../../constants/gameModeConstats';
import type { RatingInfo } from '../../constants/profileConstants';

type Props = {
	id: GameModeType
	emoji: string
	label: string
	time: string
	desc: string
	increment?: string
	ratingInfo?: RatingInfo | null
	onSelect: (mode: GameModeType) => void
}

function GameMode({ id, emoji, label, time, desc, increment, ratingInfo, onSelect }: Props) {
	return (
		<button
			className={`${styles.homeModeCard} ${styles[modeClassMap[id]]}`}
			onClick={() => onSelect(id)}
		>
			<div className={styles.homeModeTop}>
				<span className={styles.homeModeEmoji}>{emoji}</span>
				{increment && (
					<span className={styles.homeModeIncBadge}>+2s / move</span>
				)}
			</div>
			<div className={styles.homeModeLabel}>{label}</div>
			<div className={styles.homeModeTime}>{time}</div>
			<div className={styles.homeModeRating}>
				{ratingInfo ? (
					<span className={styles.ratingBadge}>
						🏆 {ratingInfo.isProvisional ? `~${ratingInfo.rating}` : ratingInfo.rating}
						{ratingInfo.isProvisional && (
							<span className={styles.provisionalSub}> ({ratingInfo.gamesPlayed}/5)</span>
						)}
					</span>
				) : (
					<span className={`${styles.ratingBadge} ${styles.ratingUnrated}`}>
						🏆 —
					</span>
				)}
			</div>
			<div className={styles.homeModeDesc}>{desc}</div>
			<div className={styles.homeModePlay}>Play ⚔️</div>
		</button>
	)
}

export default GameMode
