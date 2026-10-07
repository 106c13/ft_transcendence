import styles from './GameMode.module.css';
import type { GameModeType } from '../../utils/gameModeUtils';
import { modeClassMap } from '../../utils/gameModeUtils';
import GameModeIcon from '../GameModeIcon/GameModeIcon';

type Props = {
	id: GameModeType;
	emoji?: string;
	label: string;
	time: string;
	desc?: string;
	increment?: string;
	onSelect: (mode: GameModeType) => void;
};

const GameMode = ({ id, label, time, desc, increment, onSelect }: Props) => {
	return (
		<button
			className={`${styles.homeModeCard} ${styles[modeClassMap[id]]}`}
			onClick={() => onSelect(id)}
			type="button"
		>
			<div className={styles.homeModeTop}>
				<span className={styles.homeModeEmoji}>
					<GameModeIcon mode={id} size={26} />
				</span>
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
	);
};

export default GameMode;
