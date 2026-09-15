import type { GameModeType, ModeItem } from '../../constants/gameModeConstats';
import type { RatingInfo } from '../../constants/profileConstants';
import styles from './GameModesGrid.module.css'
import GameMode from '../GameMode/GameMode';

type Props = {
	modes: ModeItem[]
	ratings?: Record<string, RatingInfo | null> | null
	onSelectMode: (mode: GameModeType) => void
}

function GameModesGrid({ modes, ratings, onSelectMode }: Props) {
	return (
		<div className={styles.homeModesGrid}>
			{modes.map((mode) => {
				const baseCategory = mode.id.replace('+2', '')
				const ratingInfo = ratings ? ratings[baseCategory] : null

				return (
					<GameMode
						key={mode.id}
						id={mode.id}
						emoji={mode.emoji}
						label={mode.label}
						time={mode.time}
						desc={mode.desc}
						increment={mode.increment}
						ratingInfo={ratingInfo}
						onSelect={onSelectMode}
					/>
				)
			})}
		</div>
	)
}

export default GameModesGrid
