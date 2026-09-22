import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import profileStyles from './ProfileTabs.module.css'
import type { TabType, User } from '../../constants/profileConstants'
import { useGameHistory } from '../../hooks/useGameHistory'
import { useRatingHistory, type RatingCategory } from '../../hooks/useRatingHistory'
import FriendsList from '../FriendsList/FriendsList'
import GamesList from '../GamesList/GamesList'
import MiniRatingChart from '../MiniRatingChart/MiniRatingChart'
import FriendsPreview from '../FriendsPreview/FriendsPreview'
import GameRow from '../GameRow/GameRow'
import type { MatchRecord } from '../GameAnalysis/GameAnalysis'

type Props = {
	activeTab: TabType
	friends: User[]
	username?: string
	isOwnProfile: boolean
	ratings?: User['ratings']
	onSelectTab: (tab: TabType) => void
	onFriendClick: (targetUsername: string) => void
}

export default function ProfileTabs({
	activeTab,
	username,
	friends,
	isOwnProfile,
	ratings,
	onSelectTab,
	onFriendClick,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	// Load match history for games and rating computations
	const history = useGameHistory(username || '')
	const ratingData = useRatingHistory(history.matches, username || '', ratings)

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
					{/* 3 Small Rating Sparkline Charts for bullet, blitz, rapid */}
					<div className={profileStyles.ratingsGrid}>
						<MiniRatingChart
							mode="bullet"
							history={ratingData.bullet}
							onClick={() => handleChartClick('bullet')}
						/>
						<MiniRatingChart
							mode="blitz"
							history={ratingData.blitz}
							onClick={() => handleChartClick('blitz')}
						/>
						<MiniRatingChart
							mode="rapid"
							history={ratingData.rapid}
							onClick={() => handleChartClick('rapid')}
						/>
					</div>

					{/* Friends Preview Strip (up to 7 avatars horizontally) */}
					<FriendsPreview
						friends={friends}
						onFriendClick={onFriendClick}
						onSeeAll={() => onSelectTab('friends')}
					/>

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
							<div className={profileStyles.emptyRecentGames}>
								{t('loading', 'Loading recent games...')}
							</div>
						) : recentMatches.length === 0 ? (
							<div className={profileStyles.emptyRecentGames}>
								{t('no_games_yet', 'No games played yet')}
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