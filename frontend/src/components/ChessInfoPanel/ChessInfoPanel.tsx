import { useTranslation } from 'react-i18next'
import MoveHistory from '../MoveHistory/MoveHistory'
import GameActions from '../GameActions/GameActions'
import type { DrawOfferState } from '../../hooks/useGameSocket'
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
	moveTimes?: number[]
	viewIndex: number
	isReviewing: boolean
	isGameOver: boolean
	onSelectIndex: (idx: number) => void
	onResign: () => void
	drawOfferState: DrawOfferState
	onOfferDraw: () => void
	onAcceptDraw: () => void
	onDeclineDraw: () => void
	onAnalyze?: () => void
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
	captured: _captured,
	whiteScore: _whiteScore,
	blackScore: _blackScore,
	playerColor: _playerColor,
	moveHistory,
	moveSAN,
	moveTimes,
	viewIndex,
	isReviewing,
	isGameOver,
	onSelectIndex,
	onResign,
	drawOfferState,
	onOfferDraw,
	onAcceptDraw,
	onDeclineDraw,
	onAnalyze,
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

			<MoveHistory
				moveHistory={moveHistory}
				moveSAN={moveSAN}
				moveTimes={moveTimes}
				viewIndex={viewIndex}
				isReviewing={isReviewing}
				onSelectIndex={onSelectIndex}
			/>

			<GameActions
				isGameOver={isGameOver}
				onResign={onResign}
				drawOfferState={drawOfferState}
				onOfferDraw={onOfferDraw}
				onAcceptDraw={onAcceptDraw}
				onDeclineDraw={onDeclineDraw}
				onAnalyze={onAnalyze}
			/>
		</div>
	)
}

export default ChessInfoPanel