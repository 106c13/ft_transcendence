import type { GameModeType, ModeItem } from '../../constants/gameModeConstats';
import styles from './GameModesGrid.module.css'
import GameMode from '../GameMode/GameMode';

type Props = {
	modes: ModeItem[]
	onSelectMode: (mode: GameModeType) => void
}

function GameModesGrid({ modes, onSelectMode }: Props) {
	return (
		<div className={styles.homeModesGrid}>
			{modes.map((mode) => (
				<GameMode
					key={mode.id}
					id={mode.id}
					emoji={mode.emoji}
					label={mode.label}
					time={mode.time}
					desc={mode.desc}
					increment={mode.increment}
					onSelect={onSelectMode}
				/>
			))}
		</div>
	)
}

export default GameModesGrid
