import styles from './PlayerBanner.module.css'

type Props = {
	name: string
	color: 'w' | 'b'
	time: number
	isActive: boolean
	isBottom?: boolean
}

export function formatTime(timeMs: number) {
	const totalSecs = Math.floor(timeMs / 1000)
	const mins = Math.floor(totalSecs / 60)
	const secs = totalSecs % 60
	const tenths = Math.floor((timeMs % 1000) / 100)

	const minStr = mins.toString().padStart(2, '0')
	const secStr = secs.toString().padStart(2, '0')

	if (timeMs < 15000) {
		return `${mins}:${secStr}.${tenths}`
	}
	return `${minStr}:${secStr}`
}

function PlayerBanner({ name, color, time, isActive, isBottom = false }: Props) {
	const isLowTime = isActive && time < 15000

	return (
		<div
			className={`${styles.playerBanner} ${isBottom ? styles.bottom : ''} ${isActive ? styles.activeTurn : ''} ${isLowTime ? styles.lowTime : ''}`}
		>
			<div className={styles.playerInfo}>
				<span className={`${styles.playerColorDot} ${color === 'w' ? styles.white : styles.black}`} />
				<span className={styles.playerName}>{name}</span>
			</div>
			<div className={styles.gameClock}>{formatTime(time)}</div>
		</div>
	)
}

export default PlayerBanner