import { useTranslation } from 'react-i18next'
import { getPieceImageSrc, PIECE_NAME } from '../../constants/gameConstants'
import styles from './PromotionOverlay.module.css'

type Props = {
	playerColor: 'w' | 'b'
	square?: string | null
	ranks?: string[]
	files?: string[]
	onSelect: (pieceCode: string) => void
	onCancel: () => void
}

function PromotionOverlay({
	playerColor,
	square,
	ranks,
	files,
	onSelect,
	onCancel,
}: Props) {
	const { t } = useTranslation()

	// Calculate anchored positioning based on the promotion square
	const colIdx = square && files ? files.indexOf(square[0]) : 3
	const rowIdx = square && ranks ? ranks.indexOf(square[1]) : 0

	const safeCol = colIdx >= 0 ? colIdx : 3
	const safeRow = rowIdx >= 0 ? rowIdx : 0

	// If promotion square is on top half, anchor from top; otherwise anchor from bottom
	const isTopRank = safeRow <= 3

	const positionStyle: React.CSSProperties = {
		left: `calc(${safeCol * 12.5}% + 6.25%)`,
		transform: 'translateX(-50%)',
		...(isTopRank
			? { top: `calc(${safeRow * 12.5}% + 8px)` }
			: { bottom: `calc(${(7 - safeRow) * 12.5}% + 8px)` }),
	}

	return (
		<>
			{/* Transparent non-blur backdrop on board to capture clicks outside */}
			<div
				className={styles.transparentBackdrop}
				onClick={onCancel}
				onContextMenu={e => {
					e.preventDefault()
					e.stopPropagation()
					onCancel()
				}}
			/>

			{/* Mini square-anchored promotion modal */}
			<div
				className={styles.miniPromotionBox}
				style={positionStyle}
				onContextMenu={e => {
					e.preventDefault()
					e.stopPropagation()
					onCancel()
				}}
			>
				<button
					type="button"
					className={styles.closeBtn}
					onClick={e => {
						e.stopPropagation()
						onCancel()
					}}
					aria-label={t('cancel', 'Cancel')}
					title={t('cancel', 'Cancel')}
				>
					✕
				</button>

				<div className={styles.pieceOptionsColumn}>
					{(['q', 'r', 'b', 'n'] as const).map(code => (
						<button
							key={code}
							type="button"
							className={styles.pieceOptionBtn}
							onClick={e => {
								e.stopPropagation()
								onSelect(code)
							}}
							title={t(PIECE_NAME[code].toLowerCase(), PIECE_NAME[code])}
						>
							<img
								src={getPieceImageSrc(code, playerColor)}
								alt={t(PIECE_NAME[code].toLowerCase(), PIECE_NAME[code])}
								className={styles.pieceImg}
							/>
						</button>
					))}
				</div>
			</div>
		</>
	)
}

export default PromotionOverlay