import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Chess, type Square } from 'chess.js'
import type { MatchRecord } from '../GameAnalysis/GameAnalysis'
import { getPieceImageSrc, PIECE_NAME } from '../../constants/gameConstants'
import styles from './GameReviewCard.module.css'

type Props = {
	games: MatchRecord[]
	currentUsername?: string
	loading?: boolean
}

export default function GameReviewCard({ games, currentUsername, loading }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	// Initial random seed generated on mount
	const [randomSeed] = useState(() => Math.random())

	// Pick randomly from the previous 5 games
	const pool = useMemo(() => games.slice(0, 5), [games])

	const selectedGame = useMemo(() => {
		if (pool.length === 0) return null
		const initialIndex = Math.floor(randomSeed * pool.length)
		return pool[initialIndex] || pool[0]
	}, [pool, randomSeed])

	const boardData = useMemo(() => {
		if (!selectedGame) return null

		const chess = new Chess()
		try {
			if (selectedGame.pgn) {
				chess.loadPgn(selectedGame.pgn)
			}
		} catch {
			// fallback
		}

		const history = chess.history({ verbose: true })
		const lastMove = history.length > 0 ? {
			from: history[history.length - 1].from,
			to: history[history.length - 1].to,
		} : null

		const isUserBlack = selectedGame.black?.username === currentUsername
		const orientation: 'w' | 'b' = isUserBlack ? 'b' : 'w'

		const files = orientation === 'b'
			? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
			: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
		const ranks = orientation === 'b'
			? ['1', '2', '3', '4', '5', '6', '7', '8']
			: ['8', '7', '6', '5', '4', '3', '2', '1']

		return {
			chess,
			lastMove,
			orientation,
			files,
			ranks,
		}
	}, [selectedGame, currentUsername])

	const handleReviewClick = () => {
		if (!selectedGame) return
		navigate(`/game/analysis/${selectedGame.id}`, {
			state: { match: selectedGame, fromUsername: currentUsername },
		})
	}

	if (loading) {
		return (
			<div className={styles.reviewContainer}>
				<div className={styles.loadingCard}>
					<span className={styles.spinnerIcon}>♟</span>
					<p>{t('loading', 'Loading games...')}</p>
				</div>
			</div>
		)
	}

	if (!selectedGame || !boardData) {
		return (
			<div className={styles.reviewContainer}>
				<div className={styles.emptyCard}>
					<div className={styles.emptyIcon}>♟️</div>
					<h4 className={styles.emptyTitle}>{t('no_games_to_review', 'Review Past Games')}</h4>
					<p className={styles.emptySubtitle}>
						{t('play_to_unlock_review', 'Play a game to see your moves and analyze key moments here.')}
					</p>
				</div>
			</div>
		)
	}

	const isWhite = selectedGame.white?.username === currentUsername
	const opponent = isWhite ? selectedGame.black : selectedGame.white
	const opponentName = opponent?.username || t('opponent')

	// Calculate arrow coordinates if lastMove exists
	let arrowShaft: React.ReactNode = null
	let arrowHead: React.ReactNode = null
	if (boardData.lastMove) {
		const fromFile = boardData.lastMove.from[0]
		const fromRank = boardData.lastMove.from[1]
		const toFile = boardData.lastMove.to[0]
		const toRank = boardData.lastMove.to[1]

		const fromCol = boardData.files.indexOf(fromFile)
		const fromRow = boardData.ranks.indexOf(fromRank)
		const toCol = boardData.files.indexOf(toFile)
		const toRow = boardData.ranks.indexOf(toRank)

		if (fromCol !== -1 && fromRow !== -1 && toCol !== -1 && toRow !== -1) {
			const startX = fromCol * 100 + 50
			const startY = fromRow * 100 + 50
			const endX = toCol * 100 + 50
			const endY = toRow * 100 + 50

			const dx = endX - startX
			const dy = endY - startY
			const len = Math.hypot(dx, dy)

			if (len > 0) {
				const ux = dx / len
				const uy = dy / len
				const tipOffset = 14
				const headLen = 30
				const headWidth = 22

				const tipX = endX - ux * tipOffset
				const tipY = endY - uy * tipOffset
				const baseX = tipX - ux * headLen
				const baseY = tipY - uy * headLen

				const nx = -uy
				const ny = ux

				const w1X = baseX + nx * headWidth
				const w1Y = baseY + ny * headWidth
				const w2X = baseX - nx * headWidth
				const w2Y = baseY - ny * headWidth

				arrowShaft = (
					<line
						x1={startX}
						y1={startY}
						x2={baseX + ux * 4}
						y2={baseY + uy * 4}
						stroke="#F59E0B"
						strokeWidth="16"
						strokeLinecap="round"
					/>
				)
				arrowHead = (
					<polygon
						points={`${tipX},${tipY} ${w1X},${w1Y} ${w2X},${w2Y}`}
						fill="#F59E0B"
						stroke="#F59E0B"
						strokeWidth="2"
						strokeLinejoin="round"
					/>
				)
			}
		}
	}

	return (
		<div className={styles.reviewContainer}>
			{/* Perfect Square Board */}
			<div
				className={styles.boardCard}
				onClick={handleReviewClick}
				role="button"
				tabIndex={0}
				aria-label={`Review game against ${opponentName}`}
			>
				<div className={styles.board}>
					{boardData.ranks.map((rank, rIdx) =>
						boardData.files.map((file, cIdx) => {
							const sq = `${file}${rank}`
							const piece = boardData.chess.get(sq as Square)
							const isLight = (cIdx + rIdx) % 2 === 0
							const isSrc = boardData.lastMove?.from === sq
							const isDst = boardData.lastMove?.to === sq
							const isFirstCol = cIdx === 0
							const isLastRow = rIdx === boardData.ranks.length - 1

							return (
								<div
									key={sq}
									className={`${styles.square} ${isLight ? styles.light : styles.dark} ${
										isSrc ? styles.lastMoveSrc : ''
									} ${isDst ? styles.lastMoveDst : ''}`}
								>
									{isFirstCol && (
										<span className={`${styles.coord} ${styles.coordRank} ${isLight ? styles.coordLight : styles.coordDark}`}>
											{rank}
										</span>
									)}
									{isLastRow && (
										<span className={`${styles.coord} ${styles.coordFile} ${isLight ? styles.coordLight : styles.coordDark}`}>
											{file}
										</span>
									)}

									{piece && (
										<img
											src={getPieceImageSrc(piece.type, piece.color)}
											alt={`${piece.color === 'w' ? t('white') : t('black')} ${t(PIECE_NAME[piece.type].toLowerCase())}`}
											className={styles.pieceImg}
											draggable={false}
										/>
									)}
								</div>
							)
						})
					)}

					{/* Vector Arrow Overlay */}
					{(arrowShaft || arrowHead) && (
						<svg
							className={styles.arrowOverlay}
							viewBox="0 0 800 800"
							preserveAspectRatio="none"
						>
							<g opacity="0.85">
								{arrowShaft}
								{arrowHead}
							</g>
						</svg>
					)}
				</div>
			</div>

			{/* Review Button Under the Board */}
			<button
				className={styles.reviewBtn}
				onClick={handleReviewClick}
				type="button"
				title={t('review_against_opponent', {
					opponent: opponentName,
					defaultValue: `Review against ${opponentName}`,
				})}
			>
				<span className={styles.reviewBtnIcon}>🔍</span>
				<span className={styles.reviewBtnText}>
					{t('review_against_opponent', {
						opponent: opponentName,
						defaultValue: `Review against ${opponentName}`,
					})}
				</span>
			</button>
		</div>
	)
}
