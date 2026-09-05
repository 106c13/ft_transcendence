import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Square } from 'chess.js'
import { getPieceImageSrc, PIECE_NAME } from '../../constants/gameConstants'
import type { useGameAnalysis } from '../../hooks/useGameAnalysis'
import type { useGameHistory } from '../../hooks/useGameHistory'
import styles from './GameAnalysis.module.css'

// ── Shared types ──
export type MatchRecord = {
	id: number
	white_id: number
	black_id: number
	winner_id: number | null
	mode: 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'
	result: string
	pgn: string
	played_at: string
	analysis?: GameAnalysisResult
	white?: { id: number; username: string; avatar?: string }
	black?: { id: number; username: string; avatar?: string }
	winner?: { id: number; username: string; avatar?: string }
}

export interface MoveAnalysis {
	ply: number;
	moveNumber: number;
	color: 'w' | 'b';
	san: string;
	from: string;
	to: string;
	fenBefore: string;
	fenAfter: string;
	score: number;
	mate: number | null;
	centipawnLoss?: number;
	winChance: number;

	bestMove: {
		from: string;
		to: string;
		san: string;
	} | null;
	continuation: string[];
	classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
	explanation: string;
}

export interface GameAnalysisResult {
	accuracy: {
		white: number;
		black: number;
	};
	summary: {
		white: Record<string, number>;
		black: Record<string, number>;
	};
	positions: MoveAnalysis[];
}

// ── Badge color mapping ──
const BADGE_STYLES: Record<string, string> = {
	brilliant: styles.badgeBrilliant,
	great: styles.badgeGreat,
	best: styles.badgeBest,
	excellent: styles.badgeExcellent,
	good: styles.badgeGood,
	inaccuracy: styles.badgeInaccuracy,
	mistake: styles.badgeMistake,
	blunder: styles.badgeBlunder,
	default: styles.badgeDefault,
}

type Props = {
	username: string
	analysis: ReturnType<typeof useGameAnalysis>
	history: ReturnType<typeof useGameHistory>
	onBack?: () => void
}

function GameAnalysis({ username, analysis, history, onBack }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const {
		selectedGame,
		isAnalyzing,
		analysisData,
		currentPly,
		showBestMoveHint,
		moveListRef,
		currentPosition,
		displayChess,
		evalInfo,
		isSuboptimalMove,
		closeAnalysis,
		goToPly,
		toggleBestMove,
		getClassificationBadge,
	} = analysis

	const { formatDate, formatReason, handleDownloadPgn } = history

	if (!selectedGame) return null

	const isUserWhite = selectedGame.white?.username === username
	const opponent = isUserWhite ? selectedGame.black : selectedGame.white
	const userColor = isUserWhite ? 'white' : 'black'
	const opponentColor = isUserWhite ? 'black' : 'white'
	const outcome = history.getOutcome(selectedGame)

	const ranks = isUserWhite ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8']
	const files = isUserWhite ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']

	return (
		<div className={styles.container}>
			{/* Match Header Bar */}
			<div className={styles.headerCard}>
				<div className={styles.headerTop}>
					<button className={styles.backBtn} onClick={onBack || closeAnalysis}>
						← {t('back_to_games', 'Back to Games')}
					</button>
					<span className={`${styles.modeBadge} ${styles[`mode${selectedGame.mode.replace('+', 'Plus')}`] || ''}`}>
						{selectedGame.mode}
					</span>
				</div>

				<div className={styles.matchup}>
					<div className={styles.player}>
						<span className={`${styles.colorIndicator} ${styles[userColor]}`}></span>
						<span className={styles.playerName}>{username} (You)</span>
					</div>
					<div className={styles.vs}>{t('vs', 'vs')}</div>
					<div className={styles.player}>
						<span className={`${styles.colorIndicator} ${styles[opponentColor]}`}></span>
						<span
							className={`${styles.playerName} ${styles.opponentLink}`}
							onClick={() => opponent?.username && navigate(`/profile/${opponent.username}`)}
						>
							{opponent?.username || 'Opponent'}
						</span>
					</div>
				</div>

				<div className={styles.resultBar}>
					<span className={`${styles.outcomePill} ${styles[`outcome${outcome.className.charAt(0).toUpperCase() + outcome.className.slice(1)}`]}`}>
						{outcome.label}
					</span>
					<span className={styles.resultReason}>
						{formatReason(selectedGame.result)}
					</span>
					<span className={styles.matchDate}>
						{formatDate(selectedGame.played_at)}
					</span>
				</div>
			</div>

			{/* Loading Analysis Screen */}
			{isAnalyzing && (
				<div className={styles.placeholderCard}>
					<div className={styles.animContainer}>
						<div className={styles.pulseRingOuter}></div>
						<div className={styles.pulseRing}></div>
						<div className={styles.animIcon}>♟️</div>
					</div>

					<h3 className={styles.analysisTitle}>{t('analyzing_game', 'Analyzing game...')}</h3>

					<div className={styles.progressbarContainer}>
						<div className={styles.progressbarFill}></div>
					</div>

					<p className={styles.statusText}>
						{t('evaluating_moves', 'Evaluating moves and critical moments with chess engine...')}
					</p>

					{selectedGame.pgn && (
						<div className={styles.pgnDownloadSection}>
							<button
								className={styles.downloadPgnBtn}
								onClick={() => handleDownloadPgn(selectedGame)}
							>
								📥 {t('download_pgn', 'Download PGN')}
							</button>
						</div>
					)}
				</div>
			)}

			{/* Full Interactive Analysis Board */}
			{!isAnalyzing && analysisData && (
				<div className={styles.workspace}>
					{/* Accuracy Overview Banner */}
					<div className={styles.accuracyBanner}>
						<div className={`${styles.accuracyCard} ${styles.whiteSide}`}>
							<div className={styles.accuracyHeader}>
								<span className={`${styles.sideDot} ${styles.white}`}></span>
								<span className={styles.playerTitle}>{selectedGame.white?.username || 'White'}</span>
							</div>
							<div className={styles.accuracyScore}>{analysisData.accuracy.white}%</div>
							<div className={styles.accuracyBarTrack}>
								<div className={`${styles.accuracyBarFill} ${styles.white}`} style={{ width: `${analysisData.accuracy.white}%` }}></div>
							</div>
							<div className={styles.accuracyChips}>
								{analysisData.summary.white.brilliant > 0 && <span className={`${styles.chip} ${styles.chipBrilliant}`}>💎 {analysisData.summary.white.brilliant}</span>}
								<span className={`${styles.chip} ${styles.chipBest}`}>⭐ {analysisData.summary.white.best}</span>
								<span className={`${styles.chip} ${styles.chipMistake}`}>🟠 {analysisData.summary.white.mistake}</span>
								<span className={`${styles.chip} ${styles.chipBlunder}`}>🔴 {analysisData.summary.white.blunder}</span>
							</div>
						</div>

						<div className={`${styles.accuracyCard} ${styles.blackSide}`}>
							<div className={styles.accuracyHeader}>
								<span className={`${styles.sideDot} ${styles.black}`}></span>
								<span className={styles.playerTitle}>{selectedGame.black?.username || 'Black'}</span>
							</div>
							<div className={styles.accuracyScore}>{analysisData.accuracy.black}%</div>
							<div className={styles.accuracyBarTrack}>
								<div className={`${styles.accuracyBarFill} ${styles.black}`} style={{ width: `${analysisData.accuracy.black}%` }}></div>
							</div>
							<div className={styles.accuracyChips}>
								{analysisData.summary.black.brilliant > 0 && <span className={`${styles.chip} ${styles.chipBrilliant}`}>💎 {analysisData.summary.black.brilliant}</span>}
								<span className={`${styles.chip} ${styles.chipBest}`}>⭐ {analysisData.summary.black.best}</span>
								<span className={`${styles.chip} ${styles.chipMistake}`}>🟠 {analysisData.summary.black.mistake}</span>
								<span className={`${styles.chip} ${styles.chipBlunder}`}>🔴 {analysisData.summary.black.blunder}</span>
							</div>
						</div>
					</div>

					{/* Main Board & Eval Bar Area */}
					<div className={styles.mainArea}>
						{/* Side Evaluation Bar */}
						<div className={styles.evalBarWrapper}>
							<div className={styles.evalBarContainer}>
								<div
									className={styles.evalBarWhite}
									style={{ height: `${evalInfo.winChanceWhite}%` }}
								></div>
								<div className={styles.evalBarBlack}></div>
								<div className={`${styles.evalBarLabel} ${evalInfo.isWhiteAdvantage ? styles.evalWhiteSide : styles.evalBlackSide}`}>
									{evalInfo.scoreText}
								</div>
							</div>
							<span className={styles.evalSideHint}>Eval</span>
						</div>

						{/* Chess Board with SVG pieces */}
						<div className={styles.boardWrapper}>
							<div className={styles.chessBoard}>
								{ranks.map((rank, rankIdx) =>
									files.map((file, fileIdx) => {
										const sq = `${file}${rank}`
										const piece = displayChess.get(sq as Square)
										const isLight = (fileIdx + rankIdx) % 2 === 0

										const isPlayedSrc = currentPosition?.from === sq
										const isPlayedDst = currentPosition?.to === sq
										const isBestMoveSrc = showBestMoveHint && isSuboptimalMove && currentPosition?.bestMove?.from === sq
										const isBestMoveDst = showBestMoveHint && isSuboptimalMove && currentPosition?.bestMove?.to === sq

										const sqClasses = [
											styles.square,
											isLight ? styles.light : styles.dark,
											isPlayedSrc ? styles.playedSrc : '',
											isPlayedDst ? styles.playedDst : '',
											isBestMoveSrc ? styles.bestSrc : '',
											isBestMoveDst ? styles.bestDst : '',
										].filter(Boolean).join(' ')

										return (
											<div key={sq} className={sqClasses}>
												{piece && (
													<img
														src={getPieceImageSrc(piece.type, piece.color)}
														alt={`${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAME[piece.type]}`}
														className={`${styles.pieceImg} ${piece.color === 'w' ? styles.whitePiece : styles.blackPiece}`}
													/>
												)}

												{/* Classification marker on played move destination */}
												{isPlayedDst && currentPosition && (
													<div className={`${styles.evalMarker} ${BADGE_STYLES[currentPosition.classification] || BADGE_STYLES.default}`}>
														{getClassificationBadge(currentPosition.classification).icon}
													</div>
												)}

												{/* Best move target indicator */}
												{isBestMoveDst && (
													<div className={styles.bestMoveTargetRing} title={`Best move was to ${sq}`}>
														⭐
													</div>
												)}
											</div>
										)
									})
								)}
							</div>
						</div>

						{/* Right: Move Details & Move History Log */}
						<div className={styles.controlPanel}>
							{/* Current Move Assessment Card */}
							<div className={styles.assessmentCard}>
								{currentPosition ? (
									<>
										<div className={styles.assessmentTop}>
											<span className={styles.assessmentMoveTitle}>
												{currentPosition.moveNumber}. {currentPosition.color === 'w' ? '' : '... '}{currentPosition.san}
											</span>
											<span className={`${styles.classificationBadge} ${BADGE_STYLES[currentPosition.classification] || BADGE_STYLES.default}`}>
												{getClassificationBadge(currentPosition.classification).icon} {getClassificationBadge(currentPosition.classification).label}
											</span>
										</div>

										<p className={styles.assessmentExplanation}>{currentPosition.explanation}</p>

										{/* Best Move Recommendation */}
										{isSuboptimalMove && currentPosition.bestMove && (
											<div className={styles.bestMoveBox}>
												<div className={styles.recHeader}>
													<span className={styles.recLabel}>💡 Best Move:</span>
													<strong className={styles.recMoveSan}>{currentPosition.bestMove.san}</strong>
												</div>
												{currentPosition.continuation.length > 0 && (
													<div className={styles.continuationLine}>
														<span className={styles.continuationLabel}>Engine Line:</span>
														<span className={styles.continuationMoves}>
															{currentPosition.continuation.join(' ')}
														</span>
													</div>
												)}
												<button
													className={styles.toggleBestHintBtn}
													onClick={toggleBestMove}
												>
													{showBestMoveHint ? '👁️ Hide Best Move' : '👁️ Show Best Move on Board'}
												</button>
											</div>
										)}

										{/* Engine Telemetry */}
										<div className={styles.engineStats}>
											<div className={styles.engineStatItem}>
												<span className={styles.statName}>Engine:</span>
												<span className={styles.statVal}>Stockfish (Depth 15)</span>
											</div>
											<div className={styles.engineStatItem}>
												<span className={styles.statName}>Eval Score:</span>
												<span className={styles.statVal}>{evalInfo.scoreText}</span>
											</div>
											<div className={styles.engineStatItem}>
												<span className={styles.statName}>Centipawn Loss:</span>
												<span className={styles.statVal}>{currentPosition.centipawnLoss !== undefined ? `${currentPosition.centipawnLoss} cp` : '0 cp'}</span>
											</div>
											<div className={styles.engineStatItem}>
												<span className={styles.statName}>Win Chance:</span>
												<span className={styles.statVal}>White {evalInfo.winChanceWhite}% • Black {evalInfo.winChanceBlack}%</span>
											</div>
										</div>
									</>
								) : (
									<div className={styles.startPlaceholder}>
										<span>♟️ Starting Position</span>
										<p>Use arrows or click moves below to evaluate the game.</p>
									</div>
								)}
							</div>

							{/* Move Navigation Buttons */}
							<div className={styles.navBar}>
								<button title="Start (Down Arrow)" onClick={() => goToPly(-1)}>⇤</button>
								<button title="Previous (Left Arrow)" onClick={() => goToPly(Math.max(-1, currentPly - 1))}>◀</button>
								<button title="Next (Right Arrow)" onClick={() => goToPly(Math.min(analysisData.positions.length - 1, currentPly + 1))}>▶</button>
								<button title="End (Up Arrow)" onClick={() => goToPly(analysisData.positions.length - 1)}>⇥</button>
							</div>

							{/* Move History Table */}
							<div className={styles.movesTable} ref={moveListRef}>
								{Array.from({ length: Math.ceil(analysisData.positions.length / 2) }).map((_, moveRowIdx) => {
									const whitePly = moveRowIdx * 2
									const blackPly = moveRowIdx * 2 + 1
									const whitePos = analysisData.positions[whitePly]
									const blackPos = analysisData.positions[blackPly]
									const moveNumber = moveRowIdx + 1

									return (
										<div key={moveNumber} className={styles.moveRow}>
											<span className={styles.rowNumber}>{moveNumber}.</span>

											{whitePos && (
												<div
													className={`${styles.moveCell} ${currentPly === whitePly ? styles.active : ''}`}
													data-active={currentPly === whitePly}
													onClick={() => goToPly(whitePly)}
												>
													<span className={styles.moveSan}>{whitePos.san}</span>
													<span className={`${styles.cellBadge} ${BADGE_STYLES[whitePos.classification] || BADGE_STYLES.default}`}>
														{getClassificationBadge(whitePos.classification).icon}
													</span>
												</div>
											)}

											{blackPos ? (
												<div
													className={`${styles.moveCell} ${currentPly === blackPly ? styles.active : ''}`}
													data-active={currentPly === blackPly}
													onClick={() => goToPly(blackPly)}
												>
													<span className={styles.moveSan}>{blackPos.san}</span>
													<span className={`${styles.cellBadge} ${BADGE_STYLES[blackPos.classification] || BADGE_STYLES.default}`}>
														{getClassificationBadge(blackPos.classification).icon}
													</span>
												</div>
											) : (
												<div className={`${styles.moveCell} ${styles.empty}`}></div>
											)}
										</div>
									)
								})}
							</div>

							{/* Download PGN */}
							<button
								className={styles.downloadPgnSmall}
								onClick={() => handleDownloadPgn(selectedGame)}
							>
								📥 {t('download_pgn', 'Download PGN')}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default GameAnalysis
