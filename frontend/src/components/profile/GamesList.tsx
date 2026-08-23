import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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
	white?: { id: number; username: string; avatar?: string }
	black?: { id: number; username: string; avatar?: string }
	winner?: { id: number; username: string; avatar?: string }
}

type Props = {
	username: string
	isOwnProfile?: boolean
}

function GamesList({ username, isOwnProfile }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [matches, setMatches] = useState<MatchRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedGame, setSelectedGame] = useState<MatchRecord | null>(null)

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

	// Selected game view for Analysis
	if (selectedGame) {
		const outcome = getOutcome(selectedGame)
		const isUserWhite = selectedGame.white?.username === username
		const opponent = isUserWhite ? selectedGame.black : selectedGame.white
		const userColor = isUserWhite ? 'white' : 'black'
		const opponentColor = isUserWhite ? 'black' : 'white'

		return (
			<div className="games-list-container">
				<div className="analysis-header-card">
					<div className="analysis-header-top">
						<button
							className="back-games-btn"
							onClick={() => setSelectedGame(null)}
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

				{/* Analysis in progress view */}
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
			</div>
		)
	}



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
								onClick={() => setSelectedGame(match)}
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
											setSelectedGame(match)
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
