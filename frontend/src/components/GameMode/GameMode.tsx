import styles from './GameMode.module.css'
import type { GameModeType } from '../../constants/gameModeConstats';
import { modeClassMap } from '../../constants/gameModeConstats';

type Props = {
	id: GameModeType
	emoji: string
	label: string
	time: string
	desc: string
	increment?: string
	onSelect: (mode: GameModeType) => void
}

function GameMode({ id, emoji, label, time, desc, increment, onSelect }: Props) {
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
			<div className={styles.homeModeDesc}>{desc}</div>
			<div className={styles.homeModePlay}>Play ⚔️</div>
		</button>
	)
}

export default GameMode
