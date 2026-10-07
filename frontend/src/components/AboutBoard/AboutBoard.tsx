import { useMemo } from 'react'
import { DEVS } from '../../utils/aboutUtils'
import type { DevKey } from '../../utils/aboutUtils'
import styles from './AboutBoard.module.css'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

interface Props {
	fen: string
	isCheckmate: boolean
	selectedDev: DevKey | null
	onSelectDev: (dev: DevKey) => void
	onClickEmpty: () => void
}

interface PieceOnSquare {
	type: string
	color: 'w' | 'b'
	dev?: DevKey
}

function parseFenToBoard(fen: string): Record<string, PieceOnSquare> {
	const board: Record<string, PieceOnSquare> = {}
	const [position] = fen.split(' ')
	const rows = position.split('/')

	rows.forEach((row, rIdx) => {
		const rank = (8 - rIdx).toString()
		let fileIdx = 0

		for (const ch of row) {
			if (ch >= '1' && ch <= '8') {
				fileIdx += parseInt(ch, 10)
			} else {
				const file = FILES[fileIdx]
				const sq = `${file}${rank}`
				const isUpper = ch === ch.toUpperCase()
				const color = isUpper ? 'w' : 'b'
				const type = ch.toLowerCase()

				let dev: DevKey | undefined
				if (color === 'w') {
					if (type === 'k') dev = 'arman'
					else if (type === 'q') dev = 'narek'
					else if (type === 'n') dev = 'hakob'
				}

				board[sq] = { type, color, dev }
				fileIdx++
			}
		}
	})

	return board
}

export default function AboutBoard({
	fen,
	isCheckmate,
	selectedDev,
	onSelectDev,
	onClickEmpty,
}: Props) {
	const boardState = useMemo(() => parseFenToBoard(fen), [fen])

	const handleSquareClick = (sq: string) => {
		const piece = boardState[sq]
		if (piece && piece.dev) {
			onSelectDev(piece.dev)
		} else {
			onClickEmpty()
		}
	}

	return (
		<div className={styles.boardWrapper}>
			{RANKS.map((rank, rankIdx) =>
				FILES.map((file, fileIdx) => {
					const sq = `${file}${rank}`
					const isLight = (fileIdx + rankIdx) % 2 === 0
					const piece = boardState[sq]

					const isSelected = Boolean(
						piece && piece.dev && piece.dev === selectedDev
					)

					const isWinnerKing = isCheckmate && piece?.color === 'w' && piece?.type === 'k'
					const isLoserKing = isCheckmate && piece?.color === 'b' && piece?.type === 'k'
					const isKingInCheck = isCheckmate && piece?.color === 'b' && piece?.type === 'k'

					let squareClass = `${styles.square} ${
						isLight ? styles.light : styles.dark
					}`
					if (isSelected) squareClass += ` ${styles.selected}`

					const pieceSvg = piece
						? `/assets/pieces/${piece.color}${piece.type.toUpperCase()}.svg`
						: ''

					return (
						<div
							key={sq}
							className={squareClass}
							onClick={() => handleSquareClick(sq)}
							data-about-piece={piece?.dev || (piece ? 'piece' : undefined)}
							title={
								piece?.dev
									? `${DEVS[piece.dev].name} (${sq})`
									: piece
									? `${piece.color === 'w' ? 'White' : 'Black'} ${piece.type.toUpperCase()} (${sq})`
									: sq
							}
						>
							{/* Rank labels on column 'a' */}
							{fileIdx === 0 && (
								<span className={styles.coordRank}>{rank}</span>
							)}
							{/* File labels on rank '1' */}
							{rank === '1' && (
								<span className={styles.coordFile}>{file}</span>
							)}

							{/* Piece image */}
							{piece && (
								<img
									src={pieceSvg}
									alt={piece.type}
									data-about-piece={piece?.dev || 'piece'}
									className={`${styles.pieceImg} ${
										isSelected ? styles.pieceSelected : ''
									} ${isKingInCheck ? styles.checkedKing : ''}`}
								/>
							)}

							{/* King Win / Loss Indicators */}
							{isWinnerKing && (
								<div className={styles.kingBadgeWinner} title="Winner">
									<svg viewBox="0 0 24 24" className={styles.kingBadgeIcon}>
										<path
											fill="currentColor"
											d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"
										/>
									</svg>
								</div>
							)}

							{isLoserKing && (
								<div className={styles.kingBadgeLoser} title="Defeated">
									<svg viewBox="0 0 24 24" className={styles.kingBadgeIcon}>
										<path
											fill="none"
											stroke="currentColor"
											strokeWidth="3.2"
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M10 4L8 20M16 4l-2 20M4 9.5h16M3.5 14.5h16"
										/>
									</svg>
								</div>
							)}
						</div>
					)
				})
			)}
		</div>
	)
}
