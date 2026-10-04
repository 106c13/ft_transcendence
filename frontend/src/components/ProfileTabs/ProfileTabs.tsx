import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import profileStyles from './ProfileTabs.module.css'
import type { TabType, User } from '../../constants/profileConstants'
import { useGameHistory } from '../../hooks/useGameHistory'
import { useRatingHistory, type RatingCategory } from '../../hooks/useRatingHistory'
import FriendsList from '../FriendsList/FriendsList'
import GamesList from '../GamesList/GamesList'
import MiniRatingChart from '../MiniRatingChart/MiniRatingChart'
import OngoingGameCard, { type LiveGameData } from '../OngoingGameCard/OngoingGameCard'
import FriendsPreview from '../FriendsPreview/FriendsPreview'
import GameRow from '../GameRow/GameRow'
import type { MatchRecord } from '../GameAnalysis/GameAnalysis'

type Props = {
	activeTab: TabType
	friends: User[]
	username?: string
	isOwnProfile: boolean
	ratings?: User['ratings']
	currentUserId?: number | null
	onSelectTab: (tab: TabType) => void
	onFriendClick: (targetUsername: string) => void
}

export default function ProfileTabs({
	activeTab,
	username,
	friends,
	isOwnProfile,
	ratings,
	currentUserId,
	onSelectTab,
	onFriendClick,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const [liveGame, setLiveGame] = useState<LiveGameData | null>(null)
	const [boardSize, setBoardSize] = useState<number | null>(null)
	const [isExitingLive, setIsExitingLive] = useState(false)
	const leftBodyRef = useRef<HTMLDivElement>(null)

	const isLiveActive = !!liveGame && !isExitingLive

	const handleStartExit = useCallback(() => {
		setIsExitingLive(true)
	}, [])

	const handleDoneExit = useCallback(() => {
		setLiveGame(null)
		setIsExitingLive(false)
	}, [])

	// Measure left content (stats list + margin + friends container) to size board 1:1
	useEffect(() => {
		if (!leftBodyRef.current || !liveGame) return

		const updateSize = () => {
			if (leftBodyRef.current) {
				const height = leftBodyRef.current.offsetHeight
				if (height > 0) {
					setBoardSize((prev) => {
						if (prev !== null && Math.abs(prev - height) <= 2) {
							return prev
						}
						return height
					})
				}
			}
		}

		updateSize()

		const ro = new ResizeObserver(() => {
			updateSize()
		})
		ro.observe(leftBodyRef.current)

		return () => ro.disconnect()
	}, [liveGame, isExitingLive, ratings, friends])

	// Load match history for games and rating computations
	const history = useGameHistory(username || '')
	const ratingData = useRatingHistory(history.matches, username || '', ratings)

	const fetchLiveGame = useCallback(async () => {
		if (!username) return
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`/api/game/live/${username}`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			})
			if (res.ok) {
				const data = await res.json()
				if (data?.gameId) {
					setLiveGame(data)
					return
				}
			}
			setLiveGame(null)
		} catch {
			setLiveGame(null)
		}
	}, [username])

	useEffect(() => {
		fetchLiveGame()
	}, [fetchLiveGame])

	// Listen for live presence changes to automatically detect game start
	useEffect(() => {
		const handleStatusChange = (e: Event) => {
			const customEvent = e as CustomEvent<{
				userId: number
				username: string
				status: string
				gameId?: string
			}>
			const data = customEvent.detail
			if (!data || !username) return

			if (data.username?.toLowerCase() === username.toLowerCase()) {
				if (data.status === 'INGAME') {
					fetchLiveGame()
				}
			}
		}

		window.addEventListener('user_status_changed', handleStatusChange)
		return () => {
			window.removeEventListener('user_status_changed', handleStatusChange)
		}
	}, [username, fetchLiveGame])

	const handleSelectGame = (match: MatchRecord) => {
		navigate(`/game/analysis/${match.id}`, {
			state: { match, fromUsername: username },
		})
	}

	const handleChartClick = (mode: RatingCategory) => {
		if (username) {
			navigate(`/profile/${username}/rating?mode=${mode}`)
		} else {
			navigate(`/profile/rating?mode=${mode}`)
		}
	}

	const isProfileBlack = username?.toLowerCase() === liveGame?.blackPlayer.username.toLowerCase()
	const opponentName = liveGame
		? (isProfileBlack ? liveGame.whitePlayer.username : liveGame.blackPlayer.username)
		: ''

	const recentMatches = history.matches.slice(0, 6)

	return (
		<div className={profileStyles.tabsWrapper}>
			{/* Profile Navigation Tabs */}
			<div className={profileStyles.profileTabs}>
				<div
					className={`${profileStyles.tab} ${activeTab === 'overview' ? profileStyles.active : ''}`}
					onClick={() => onSelectTab('overview')}
					role="button"
					tabIndex={0}
				>
					{t('overview', 'Overview')}
				</div>

				<div
					className={`${profileStyles.tab} ${activeTab === 'games' ? profileStyles.active : ''}`}
					onClick={() => onSelectTab('games')}
					role="button"
					tabIndex={0}
				>
					{t('games', 'Games')}
				</div>

				<div
					className={`${profileStyles.tab} ${activeTab === 'friends' ? profileStyles.active : ''}`}
					onClick={() => onSelectTab('friends')}
					role="button"
					tabIndex={0}
				>
					{t('friends', 'Friends')}
				</div>
			</div>

			{/* Overview Tab Content */}
			{activeTab === 'overview' && (
				<div className={profileStyles.overviewSection}>
					<div
						className={`${profileStyles.overviewLayout} ${
							isLiveActive ? profileStyles.hasLiveGame : ''
						} ${isExitingLive ? profileStyles.isExitingLive : ''}`}
						style={
							boardSize && liveGame
								? ({ '--board-size': `${boardSize}px` } as React.CSSProperties)
								: undefined
						}
					>
						{/* Left column: charts list on top, friends on bottom */}
						<div className={profileStyles.leftColumn}>
							<div className={profileStyles.sectionHeader}>
								<h3 className={profileStyles.sectionTitle}>
									{t('rating_overview_header', 'Rating Overview')}
								</h3>
							</div>

							{isLiveActive && (
								<div className={profileStyles.statsHeaderRow}>
									<span>{t('mode', 'Mode')}</span>
									<span>{t('record', 'W / D / L')}</span>
									<span>{t('trend_7d', '7D Trend')}</span>
									<span>{t('rating', 'Rating')}</span>
								</div>
							)}

							<div ref={leftBodyRef} className={profileStyles.leftBody}>
								<div
									className={
										isLiveActive
											? profileStyles.compactRatingsList
											: profileStyles.ratingsGrid
									}
								>
									<MiniRatingChart
										mode="bullet"
										history={ratingData.bullet}
										onClick={() => handleChartClick('bullet')}
										compact={isLiveActive}
									/>
									<MiniRatingChart
										mode="blitz"
										history={ratingData.blitz}
										onClick={() => handleChartClick('blitz')}
										compact={isLiveActive}
									/>
									<MiniRatingChart
										mode="rapid"
										history={ratingData.rapid}
										onClick={() => handleChartClick('rapid')}
										compact={isLiveActive}
									/>
								</div>

								<FriendsPreview
									friends={friends}
									onFriendClick={onFriendClick}
									onSeeAll={() => onSelectTab('friends')}
								/>
							</div>
						</div>

						{/* Right column: live ongoing game */}
						{liveGame && (
							<div
								className={`${profileStyles.rightColumn} ${
									isExitingLive ? profileStyles.rightColumnExiting : ''
								}`}
							>
								<div className={profileStyles.sectionHeader}>
									<h3 className={profileStyles.sectionTitle}>
										{t('live_match', 'Live Match')}
									</h3>
								</div>

								<div className={profileStyles.opponentHeaderRow}>
									<span>
										{t('playing_against', 'Playing against {{opponent}}', {
											opponent: opponentName,
										})}
									</span>
								</div>

								<div className={profileStyles.rightBody}>
									<OngoingGameCard
										gameData={liveGame}
										profileUsername={username || ''}
										currentUserId={currentUserId}
										size={boardSize}
										onGameOverStartExit={handleStartExit}
										onGameOverDone={handleDoneExit}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Recent Games List (Last 5-7 games played) */}
					<div className={profileStyles.recentGamesCard}>
						<div className={profileStyles.recentGamesHeader}>
							<div className={profileStyles.titleGroup}>
								<h3 className={profileStyles.sectionTitle}>
									{t('recent_games', 'Recent Matches')}
								</h3>
								<span className={profileStyles.countBadge}>
									{history.matches.length}
								</span>
							</div>

							{history.matches.length > 0 && (
								<button
									className={profileStyles.seeAllBtn}
									onClick={() => onSelectTab('games')}
									type="button"
								>
									{t('see_all', 'See all')} →
								</button>
							)}
						</div>

						{history.loading ? (
							<div className={profileStyles.emptyCard}>
								<span className={profileStyles.spinnerIcon}>♟</span>
								<p className={profileStyles.emptySubtitle}>
									{t('loading', 'Loading recent games...')}
								</p>
							</div>
						) : recentMatches.length === 0 ? (
							<div className={profileStyles.emptyCard}>
								<div className={profileStyles.emptyIcon}>♟️</div>
								<h4 className={profileStyles.emptyTitle}>
									{t('no_games_yet', 'No games played yet')}
								</h4>
								<p className={profileStyles.emptySubtitle}>
									{isOwnProfile
										? t('play_first_game_prompt', 'Play matches to build your game history and analysis log.')
										: t('user_no_games', 'This user has not played any games yet.')}
								</p>
								{isOwnProfile && (
									<button
										className={profileStyles.playNowBtn}
										onClick={() => navigate('/home')}
										type="button"
									>
										⚔️ {t('play_now', 'Play Now')}
									</button>
								)}
							</div>
						) : (
							<div className={profileStyles.gamesListRows}>
								<div className={profileStyles.listHeader}>
									<span>{t('mode', 'Mode')}</span>
									<span>{t('players', 'Players')}</span>
									<span>{t('result', 'Result')}</span>
									<span>{t('review', 'Review')}</span>
									<span>{t('date', 'Date')}</span>
								</div>

								<div className={profileStyles.rowsContainer}>
									{recentMatches.map((match) => (
										<GameRow
											key={match.id}
											match={match}
											username={username || ''}
											onSelect={handleSelectGame}
											onRowClick={(m) => navigate(`/game/${m.id}`)}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Games Tab Content */}
			{activeTab === 'games' && username && (
				<GamesList
					matches={history.matches}
					username={username}
					isOwnProfile={isOwnProfile}
					loading={history.loading}
					onSelectGame={handleSelectGame}
				/>
			)}

			{/* Friends Tab Content */}
			{activeTab === 'friends' && (
				<FriendsList
					friends={friends}
					onOpenProfile={onFriendClick}
				/>
			)}
		</div>
	)
}