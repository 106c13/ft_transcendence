import { useEffect, useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import './GamesList.css'


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
	score: number; // centipawns (+ white advantage, - black advantage)
	mate: number | null;
	centipawnLoss?: number;
	winChance: number; // 0 to 100

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

type Props = {
	username: string
	isOwnProfile?: boolean
}

const pieceGlyphs: Record<string, string> = {
	p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚'
}

function GamesList({ username, isOwnProfile }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [matches, setMatches] = useState<MatchRecord[]>([])
	const [loading, setLoading] = useState(true)

	// Analysis state
	const [selectedGame, setSelectedGame] = useState<MatchRecord | null>(null)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [analysisData, setAnalysisData] = useState<GameAnalysisResult | null>(null)
	const [currentPly, setCurrentPly] = useState<number>(-1) // -1 is start position
	const [showBestMoveHint, setShowBestMoveHint] = useState<boolean>(true)

	const moveListRef = useRef<HTMLDivElement>(null)

	// Fetch matches
	useEffect(() => {
		const loadMatches = async () => {
			setLoading(true)
			try {
				const token = localStorage.getItem('token')
				if (!token) return

				const res = await fetch(`/api/game/history/${username}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				if (res.ok) {
					const data = await res.json()
					setMatches(data)
				}
			} catch (err) {
				console.error('Failed to fetch game history:', err)
			} finally {
				setLoading(false)
			}
		}

		if (username) {
			loadMatches()
		}
	}, [username])

	// Trigger game analysis
	const handleSelectGameToAnalyze = async (match: MatchRecord) => {
		setSelectedGame(match)
		setCurrentPly(-1)
		setShowBestMoveHint(true)

		if (match.analysis) {
			setAnalysisData(match.analysis)
			setIsAnalyzing(false)
			return
		}

		setIsAnalyzing(true)
		setAnalysisData(null)

		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`/api/game/analyze/${match.id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (res.ok) {
				const data: GameAnalysisResult = await res.json()
				setAnalysisData(data)
				// Update in local match record
				match.analysis = data
			} else {
				console.error('Analysis request failed')
			}
		} catch (err) {
			console.error('Error starting analysis:', err)
		} finally {
			setIsAnalyzing(false)
		}
	}

	// Keyboard navigation in analysis
	useEffect(() => {
		if (!selectedGame || !analysisData) return

		const handleKeyDown = (e: KeyboardEvent) => {
			const totalPlies = analysisData.positions.length
			if (e.key === 'ArrowLeft') {
				e.preventDefault()
				setCurrentPly(p => Math.max(-1, p - 1))
			} else if (e.key === 'ArrowRight') {
				e.preventDefault()
				setCurrentPly(p => Math.min(totalPlies - 1, p + 1))
			} else if (e.key === 'ArrowDown') {
				e.preventDefault()
				setCurrentPly(-1)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setCurrentPly(totalPlies - 1)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [selectedGame, analysisData])

	// Scroll active move in log
	useEffect(() => {
		if (moveListRef.current) {
			const activeCell = moveListRef.current.querySelector('.analysis-move-cell.active')
			if (activeCell) {
				activeCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
			}
		}
	}, [currentPly])

	const getOutcome = (match: MatchRecord) => {
		const isUserWhite = match.white?.username === username
		const isUserBlack = match.black?.username === username

		if (!match.winner_id) {
			return { label: t('draw', 'Draw'), className: 'outcome-draw' }
		}

		const userWon =
			(isUserWhite && match.winner_id === match.white_id) ||
			(isUserBlack && match.winner_id === match.black_id)

		if (userWon) {
			return { label: t('victory', 'Victory'), className: 'outcome-win' }
		} else {
			return { label: t('defeat', 'Defeat'), className: 'outcome-loss' }
		}
	}

	const formatDate = (dateStr: string) => {
		try {
			const d = new Date(dateStr)
			return d.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch {
			return dateStr
		}
	}

	const formatReason = (reason: string) => {
		switch (reason) {
			case 'CHECKMATE':
				return t('reason_checkmate', 'Checkmate')
			case 'STALEMATE':
				return t('reason_stalemate', 'Stalemate')
			case 'TIMEOUT':
				return t('reason_timeout', 'Time Out')
			case 'RESIGNATION':
				return t('reason_resignation', 'Resignation')
			case 'DISCONNECTION':
				return t('reason_disconnection', 'Disconnection')
			case 'DRAW':
			case 'INSUFFICIENT_MATERIAL':
			case 'THREEFOLD_REPETITION':
				return t('reason_draw', 'Draw')
			default:
				return reason
		}
	}

	const handleDownloadPgn = (match: MatchRecord) => {
		if (!match.pgn) return
		const whiteName = match.white?.username || 'White'
		const blackName = match.black?.username || 'Black'
		const dateStr = match.played_at ? new Date(match.played_at).toISOString().split('T')[0] : 'match'
		const filename = `${whiteName}_vs_${blackName}_${dateStr}.pgn`

		const blob = new Blob([match.pgn], { type: 'application/x-chess-pgn;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}

	// Current board FEN and current move info
	const currentPosition = useMemo(() => {
		if (!analysisData || currentPly === -1 || !analysisData.positions[currentPly]) {
			return null
		}
		return analysisData.positions[currentPly]
	}, [analysisData, currentPly])

	const displayFen = useMemo(() => {
		if (currentPly === -1 || !currentPosition) {
			return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
		}
		return currentPosition.fenAfter
	}, [currentPly, currentPosition])

	const displayChess = useMemo(() => {
		return new Chess(displayFen)
	}, [displayFen])

	// Current Eval bar data (from White's perspective: 0% to 100%)
	const evalInfo = useMemo(() => {
		if (!currentPosition) {
			return {
				winChanceWhite: 50,
				winChanceBlack: 50,
				scoreText: '0.0',
				isWhiteAdvantage: true,
			}
		}

		const winChanceWhite = currentPosition.winChance
		const winChanceBlack = Math.round((100 - winChanceWhite) * 10) / 10

		let scoreText = '0.0'
		if (currentPosition.mate !== null) {
			scoreText = `M${Math.abs(currentPosition.mate)}`
		} else {
			const pawns = currentPosition.score / 100
			scoreText = pawns > 0 ? `+${pawns.toFixed(1)}` : `${pawns.toFixed(1)}`
		}

		return {
			winChanceWhite,
			winChanceBlack,
			scoreText,
			isWhiteAdvantage: currentPosition.score >= 0,
		}
	}, [currentPosition])

	const getClassificationBadge = (classification: string) => {
		switch (classification) {
			case 'brilliant':
				return { label: 'Brilliant', icon: '💎', colorClass: 'badge-brilliant' }
			case 'great':
				return { label: 'Great Move', icon: '!', colorClass: 'badge-great' }
			case 'best':
				return { label: 'Best', icon: '⭐', colorClass: 'badge-best' }
			case 'excellent':
				return { label: 'Excellent', icon: '🟢', colorClass: 'badge-excellent' }
			case 'good':
				return { label: 'Good', icon: '🔵', colorClass: 'badge-good' }
			case 'inaccuracy':
				return { label: 'Inaccuracy', icon: '🟡', colorClass: 'badge-inaccuracy' }
			case 'mistake':
				return { label: 'Mistake', icon: '🟠', colorClass: 'badge-mistake' }
			case 'blunder':
				return { label: 'Blunder', icon: '🔴', colorClass: 'badge-blunder' }
			default:
				return { label: classification, icon: '♟', colorClass: 'badge-default' }
		}
	}

	if (loading) {
		return (
			<div className="games-list-container">
				<div className="games-loading-spinner">
					<span className="spinner-icon">♟</span>
					<p>{t('loading', 'Loading games...')}</p>
				</div>
			</div>
		)
	}

	// Active Analysis View
	if (selectedGame) {
		const outcome = getOutcome(selectedGame)
		const isUserWhite = selectedGame.white?.username === username
		const opponent = isUserWhite ? selectedGame.black : selectedGame.white
		const userColor = isUserWhite ? 'white' : 'black'
		const opponentColor = isUserWhite ? 'black' : 'white'

		const ranks = isUserWhite ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8']
		const files = isUserWhite ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']

		const isSuboptimalMove = currentPosition && ['inaccuracy', 'mistake', 'blunder'].includes(currentPosition.classification)

		return (
			<div className="games-list-container">
				{/* Match Header Bar */}
				<div className="analysis-header-card">
					<div className="analysis-header-top">
						<button
							className="back-games-btn"
							onClick={() => {
								setSelectedGame(null)
								setAnalysisData(null)
							}}
						>
							← {t('back_to_games', 'Back to Games')}
						</button>
						<span className={`game-mode-badge mode-${selectedGame.mode.replace('+', '-')}`}>
							{selectedGame.mode}
						</span>
					</div>

					<div className="analysis-matchup">
						<div className="analysis-player">
							<span className={`color-indicator ${userColor}`}></span>
							<span className="player-name">{username} (You)</span>
						</div>
						<div className="analysis-vs">{t('vs', 'vs')}</div>
						<div className="analysis-player">
							<span className={`color-indicator ${opponentColor}`}></span>
							<span
								className="player-name opponent-link"
								onClick={() => opponent?.username && navigate(`/profile/${opponent.username}`)}
							>
								{opponent?.username || 'Opponent'}
							</span>
						</div>
					</div>

					<div className="analysis-result-bar">
						<span className={`outcome-pill ${outcome.className}`}>
							{outcome.label}
						</span>
						<span className="result-reason">
							{formatReason(selectedGame.result)}
						</span>
						<span className="match-date">
							{formatDate(selectedGame.played_at)}
						</span>
					</div>
				</div>

				{/* Loading Analysis Screen */}
				{isAnalyzing && (
					<div className="analysis-placeholder-card">
						<div className="analysis-anim-container">
							<div className="analysis-pulse-ring-outer"></div>
							<div className="analysis-pulse-ring"></div>
							<div className="analysis-anim-icon">♟️</div>
						</div>

						<h3 className="analysis-title">{t('analyzing_game', 'Analyzing game...')}</h3>
						
						<div className="analysis-progressbar-container">
							<div className="analysis-progressbar-fill"></div>
						</div>

						<p className="analysis-status-text">
							{t('evaluating_moves', 'Evaluating moves and critical moments with chess engine...')}
						</p>

						{selectedGame.pgn && (
							<div className="pgn-download-section">
								<button
									className="download-pgn-btn"
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
					<div className="analysis-workspace">
						{/* Left: Accuracy Overview Banner */}
						<div className="analysis-accuracy-banner">
							<div className="accuracy-player-card white-side">
								<div className="accuracy-player-header">
									<span className="side-dot white"></span>
									<span className="player-title">{selectedGame.white?.username || 'White'}</span>
								</div>
								<div className="accuracy-score-val">{analysisData.accuracy.white}%</div>
								<div className="accuracy-bar-track">
									<div className="accuracy-bar-fill white" style={{ width: `${analysisData.accuracy.white}%` }}></div>
								</div>
								<div className="accuracy-chips">
									{analysisData.summary.white.brilliant > 0 && <span className="chip brilliant">💎 {analysisData.summary.white.brilliant}</span>}
									<span className="chip best">⭐ {analysisData.summary.white.best}</span>
									<span className="chip mistake">🟠 {analysisData.summary.white.mistake}</span>
									<span className="chip blunder">🔴 {analysisData.summary.white.blunder}</span>
								</div>
							</div>

							<div className="accuracy-player-card black-side">
								<div className="accuracy-player-header">
									<span className="side-dot black"></span>
									<span className="player-title">{selectedGame.black?.username || 'Black'}</span>
								</div>
								<div className="accuracy-score-val">{analysisData.accuracy.black}%</div>
								<div className="accuracy-bar-track">
									<div className="accuracy-bar-fill black" style={{ width: `${analysisData.accuracy.black}%` }}></div>
								</div>
								<div className="accuracy-chips">
									{analysisData.summary.black.brilliant > 0 && <span className="chip brilliant">💎 {analysisData.summary.black.brilliant}</span>}
									<span className="chip best">⭐ {analysisData.summary.black.best}</span>
									<span className="chip mistake">🟠 {analysisData.summary.black.mistake}</span>
									<span className="chip blunder">🔴 {analysisData.summary.black.blunder}</span>
								</div>
							</div>
						</div>

						{/* Main Board & Eval Bar Area */}
						<div className="analysis-main-area">
							{/* Side Evaluation Bar (Chess.com style) */}
							<div className="eval-bar-wrapper">
								<div className="eval-bar-container">
									<div
										className="eval-bar-fill-white"
										style={{ height: `${evalInfo.winChanceWhite}%` }}
									></div>
									<div className="eval-bar-fill-black"></div>
									<div className={`eval-bar-label ${evalInfo.isWhiteAdvantage ? 'white-side' : 'black-side'}`}>
										{evalInfo.scoreText}
									</div>
								</div>
								<span className="eval-side-hint">Eval</span>
							</div>

							{/* Chess Board */}
							<div className="analysis-board-wrapper">
								<div className="analysis-chess-board">
									{ranks.map((rank, rankIdx) =>
										files.map((file, fileIdx) => {
											const sq = `${file}${rank}`
											const piece = displayChess.get(sq as Square)
											const isLight = (fileIdx + rankIdx) % 2 === 0
											
											const isPlayedSrc = currentPosition?.from === sq
											const isPlayedDst = currentPosition?.to === sq
											const isBestMoveSrc = showBestMoveHint && isSuboptimalMove && currentPosition?.bestMove?.from === sq
											const isBestMoveDst = showBestMoveHint && isSuboptimalMove && currentPosition?.bestMove?.to === sq

											return (
												<div
													key={sq}
													className={`analysis-sq ${isLight ? 'light' : 'dark'} ${isPlayedSrc ? 'played-src' : ''} ${isPlayedDst ? 'played-dst' : ''} ${isBestMoveSrc ? 'best-src' : ''} ${isBestMoveDst ? 'best-dst' : ''}`}
												>
													{piece && (
														<span className={`analysis-piece ${piece.color === 'w' ? 'white' : 'black'}`}>
															{pieceGlyphs[piece.type]}
														</span>
													)}

													{/* Classification marker on played move destination */}
													{isPlayedDst && currentPosition && (
														<div className={`eval-marker ${getClassificationBadge(currentPosition.classification).colorClass}`}>
															{getClassificationBadge(currentPosition.classification).icon}
														</div>
													)}

													{/* Best move target indicator */}
													{isBestMoveDst && (
														<div className="best-move-target-ring" title={`Best move was to ${sq}`}>
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
							<div className="analysis-control-panel">
								{/* Current Move Assessment Card */}
								<div className="move-assessment-card">
									{currentPosition ? (
										<>
											<div className="assessment-top">
												<span className="assessment-move-title">
													{currentPosition.moveNumber}. {currentPosition.color === 'w' ? '' : '... '}{currentPosition.san}
												</span>
												<span className={`classification-badge ${getClassificationBadge(currentPosition.classification).colorClass}`}>
													{getClassificationBadge(currentPosition.classification).icon} {getClassificationBadge(currentPosition.classification).label}
												</span>
											</div>

											<p className="assessment-explanation">{currentPosition.explanation}</p>

											{/* Best Move & "Why this move is good" Section */}
											{isSuboptimalMove && currentPosition.bestMove && (
												<div className="best-move-recommendation-box">
													<div className="rec-header">
														<span className="rec-label">💡 Best Move:</span>
														<strong className="rec-move-san">{currentPosition.bestMove.san}</strong>
													</div>
													{currentPosition.continuation.length > 0 && (
														<div className="continuation-line">
															<span className="continuation-label">Engine Line:</span>
															<span className="continuation-moves">
																{currentPosition.continuation.join(' ')}
															</span>
														</div>
													)}
													<button
														className="toggle-best-hint-btn"
														onClick={() => setShowBestMoveHint(!showBestMoveHint)}
													>
														{showBestMoveHint ? '👁️ Hide Best Move' : '👁️ Show Best Move on Board'}
													</button>
												</div>
											)}

											{/* Stockfish Engine Telemetry */}
											<div className="engine-live-stats">
												<div className="engine-stat-item">
													<span className="stat-name">Engine:</span>
													<span className="stat-val">Stockfish (Depth 12)</span>
												</div>
												<div className="engine-stat-item">
													<span className="stat-name">Eval Score:</span>
													<span className="stat-val">{evalInfo.scoreText}</span>
												</div>
												<div className="engine-stat-item">
													<span className="stat-name">Centipawn Loss:</span>
													<span className="stat-val">{currentPosition.centipawnLoss !== undefined ? `${currentPosition.centipawnLoss} cp` : '0 cp'}</span>
												</div>
												<div className="engine-stat-item">
													<span className="stat-name">Win Chance:</span>
													<span className="stat-val">White {evalInfo.winChanceWhite}% • Black {evalInfo.winChanceBlack}%</span>
												</div>
											</div>
										</>

									) : (
										<div className="assessment-start-placeholder">
											<span>♟️ Starting Position</span>
											<p>Use arrows or click moves below to evaluate the game.</p>
										</div>
									)}
								</div>


								{/* Move Navigation Buttons */}
								<div className="analysis-nav-bar">
									<button title="Start (Down Arrow)" onClick={() => setCurrentPly(-1)}>⇤</button>
									<button title="Previous (Left Arrow)" onClick={() => setCurrentPly(p => Math.max(-1, p - 1))}>◀</button>
									<button title="Next (Right Arrow)" onClick={() => setCurrentPly(p => Math.min(analysisData.positions.length - 1, p + 1))}>▶</button>
									<button title="End (Up Arrow)" onClick={() => setCurrentPly(analysisData.positions.length - 1)}>⇥</button>
								</div>

								{/* Move History Table */}
								<div className="analysis-moves-table" ref={moveListRef}>
									{Array.from({ length: Math.ceil(analysisData.positions.length / 2) }).map((_, moveRowIdx) => {
										const whitePly = moveRowIdx * 2
										const blackPly = moveRowIdx * 2 + 1
										const whitePos = analysisData.positions[whitePly]
										const blackPos = analysisData.positions[blackPly]
										const moveNumber = moveRowIdx + 1

										return (
											<div key={moveNumber} className="analysis-move-row">
												<span className="row-number">{moveNumber}.</span>

												{/* White move */}
												{whitePos && (
													<div
														className={`analysis-move-cell ${currentPly === whitePly ? 'active' : ''}`}
														onClick={() => setCurrentPly(whitePly)}
													>
														<span className="move-san">{whitePos.san}</span>
														<span className={`cell-badge ${getClassificationBadge(whitePos.classification).colorClass}`}>
															{getClassificationBadge(whitePos.classification).icon}
														</span>
													</div>
												)}

												{/* Black move */}
												{blackPos ? (
													<div
														className={`analysis-move-cell ${currentPly === blackPly ? 'active' : ''}`}
														onClick={() => setCurrentPly(blackPly)}
													>
														<span className="move-san">{blackPos.san}</span>
														<span className={`cell-badge ${getClassificationBadge(blackPos.classification).colorClass}`}>
															{getClassificationBadge(blackPos.classification).icon}
														</span>
													</div>
												) : (
													<div className="analysis-move-cell empty"></div>
												)}
											</div>
										)
									})}
								</div>

								{/* Download PGN action */}
								<button
									className="download-pgn-btn-small"
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

	// Games List Page
	return (
		<div className="games-list-container">
			<div className="games-tab-header">
				<div className="games-tab-title-group">
					<h3>{t('games', 'Games')}</h3>
					<span className="games-count-badge">{matches.length}</span>
				</div>
				<p className="games-tab-subtitle">
					{t('choose_game_to_analyze', 'Choose a game from history to analyze.')}
				</p>
			</div>

			{matches.length === 0 ? (
				<div className="empty-games-card">
					<div className="empty-icon">♟</div>
					<h4>{t('no_games_yet', 'No games played yet')}</h4>
					<p>
						{isOwnProfile
							? t('play_first_game_prompt', 'Play matches to build your game history and analysis log.')
							: t('user_no_games', 'This user has not played any games yet.')}
					</p>
					{isOwnProfile && (
						<button className="play-now-btn" onClick={() => navigate('/home')}>
							⚔️ {t('play_now', 'Play Now')}
						</button>
					)}
				</div>
			) : (
				<div className="games-grid">
					{matches.map((match) => {
						const outcome = getOutcome(match)
						const isUserWhite = match.white?.username === username
						const opponent = isUserWhite ? match.black : match.white
						const userSide = isUserWhite ? 'White' : 'Black'

						return (
							<div
								key={match.id}
								className="game-card"
								onClick={() => handleSelectGameToAnalyze(match)}
							>
								<div className="game-card-top">
									<span className={`game-mode-badge mode-${match.mode.replace('+', '-')}`}>
										{match.mode}
									</span>
									<span className="game-date">{formatDate(match.played_at)}</span>
								</div>

								<div className="game-card-matchup">
									<div className="matchup-players">
										<div className="matchup-row">
											<span className="side-dot white"></span>
											<span className={`player-label ${match.white?.username === username ? 'bold' : ''}`}>
												{match.white?.username || 'White'}
											</span>
											{match.winner_id === match.white_id && <span className="winner-crown">👑</span>}
										</div>
										<div className="matchup-row">
											<span className="side-dot black"></span>
											<span className={`player-label ${match.black?.username === username ? 'bold' : ''}`}>
												{match.black?.username || 'Black'}
											</span>
											{match.winner_id === match.black_id && <span className="winner-crown">👑</span>}
										</div>
									</div>

									<div className="game-card-outcome">
										<span className={`outcome-pill ${outcome.className}`}>
											{outcome.label}
										</span>
										<span className="reason-text">{formatReason(match.result)}</span>
									</div>
								</div>

								<div className="game-card-footer">
									<span className="user-side-info">
										{t('played_as', 'Played as')} <strong>{userSide}</strong> vs <strong>{opponent?.username || 'Opponent'}</strong>
									</span>
									<button
										className="analyze-cta-btn"
										onClick={(e) => {
											e.stopPropagation()
											handleSelectGameToAnalyze(match)
										}}
									>
										🔍 {t('analyze', 'Analyze')}
									</button>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

export default GamesList
