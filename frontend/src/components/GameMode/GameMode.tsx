import styles from './GameMode.module.css'
import type { GameModeType } from '../../constants/gameModeConstats'
import { modeClassMap } from '../../constants/gameModeConstats'

type Props = {
	id: GameModeType
	emoji: string
	label: string
	time: string
	desc?: string
	increment?: string
	onSelect: (mode: GameModeType) => void
}

function GameMode({ id, emoji, label, time, desc, increment, onSelect }: Props) {
	return (
		<button
			className={`${styles.homeModeCard} ${styles[modeClassMap[id]]}`}
			onClick={() => onSelect(id)}
			type="button"
		>
			<div className={styles.homeModeTop}>
				<span className={styles.homeModeEmoji}>{emoji}</span>
				{increment && (
					<span className={styles.homeModeIncBadge}>{increment}s</span>
				)}
			</div>
			<div className={styles.homeModeBody}>
				<div className={styles.homeModeTime}>{time}</div>
				<div className={styles.homeModeLabel}>{label}</div>
				{desc && <div className={styles.homeModeDesc}>{desc}</div>}
			</div>
		</button>
	)
}

export default GameMode
