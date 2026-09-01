import { useTranslation } from 'react-i18next'
import CapturedPieces from '../CapturedPieces/CapturedPieces'
import MoveHistory from '../MoveHistory/MoveHistory'
import GameActions from '../GameActions/GameActions'
import styles from './ChessInfoPanel.module.css'

type PieceCapture = { type: string; color: 'w' | 'b' }

type Props = {
	selectedMode: string
	captured: { w: PieceCapture[]; b: PieceCapture[] }
	whiteScore: number
	blackScore: number
	playerColor: 'w' | 'b'
	moveHistory: string[]
	moveSAN: string[]
	viewIndex: number
	isReviewing: boolean
	isGameOver: boolean
	onSelectIndex: (idx: number) => void
	onResign: () => void
}

const modeTagClassMap: Record<string, keyof typeof styles> = {
	'bullet': 'bullet',
	'bullet+2': 'bulletInc',
	'blitz': 'blitz',
	'blitz+2': 'blitzInc',
	'rapid': 'rapid',
	'rapid+2': 'rapidInc',
}

function ChessInfoPanel({
	selectedMode,
	captured,
	whiteScore,
	blackScore,
	playerColor,
	moveHistory,
	moveSAN,
	viewIndex,
	isReviewing,
	isGameOver,
	onSelectIndex,
	onResign,
}: Props) {
	const { t } = useTranslation()

	return (
		<div className={styles.gameInfoPanel}>
			<div className={styles.panelHeader}>
				<h3>{t('match_panel', 'Match Control')}</h3>
				<span className={`${styles.gameModeTag} ${styles[modeTagClassMap[selectedMode] || 'blitz']}`}>
					{selectedMode}
				</span>
			</div>

			<CapturedPieces
				captured={captured}
				whiteScore={whiteScore}
				blackScore={blackScore}
				playerColor={playerColor}
			/>

			<MoveHistory
				moveHistory={moveHistory}
				moveSAN={moveSAN}
				viewIndex={viewIndex}
				isReviewing={isReviewing}
				onSelectIndex={onSelectIndex}
			/>

			<GameActions isGameOver={isGameOver} onResign={onResign} />
		</div>
	)
}

export default ChessInfoPanel