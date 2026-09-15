import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import profileStyles from './ProfileTabs.module.css'
import type { TabType, User } from '../../constants/profileConstants'
import { useGameHistory } from '../../hooks/useGameHistory'
import FriendsList from '../FriendsList/FriendsList'
import GamesList from '../GamesList/GamesList'
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

function ProfileTabs({ activeTab, username, friends, isOwnProfile, ratings, onSelectTab, onFriendClick }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const history = useGameHistory(activeTab === 'games' && username ? username : '')

	const handleSelectGame = (match: MatchRecord) => {
		navigate(`/game/analysis/${match.id}`, {
			state: { match, fromUsername: username },
		})
	}

	const categories: Array<{
		key: 'bullet' | 'blitz' | 'rapid'
		name: string
		icon: string
		time: string
	}> = [
		{ key: 'bullet', name: t('bullet_rating', 'Bullet'), icon: '🔥', time: '1 min' },
		{ key: 'blitz', name: t('blitz_rating', 'Blitz'), icon: '⚡', time: '3 min' },
		{ key: 'rapid', name: t('rapid_rating', 'Rapid'), icon: '⏳', time: '10 min' },
	]

	return (
		<>
			<div className={profileStyles.profileTabs}>
				<div
					className={`${profileStyles.tab} ${activeTab === 'overview' ? profileStyles.active : ''}`}
					onClick={() => onSelectTab('overview')}
				>
					{t('overview')}
				</div>

				<div
					className={`${profileStyles.tab} ${activeTab === 'games' ? profileStyles.active : ''}`}
					onClick={() => onSelectTab('games')}
				>
					{t('games')}
				</div>

				<div
					className={`${profileStyles.tab} ${activeTab === 'friends' ? profileStyles.active : ''}`}
					onClick={() => onSelectTab('friends')}
				>
					{t('friends')}
				</div>
			</div>

			{activeTab === 'overview' && (
				<div className={profileStyles.overviewSection}>
					<div className={profileStyles.ratingsGrid}>
						{categories.map((cat) => {
							const info = ratings ? ratings[cat.key] : null
							const isNotPlayed = !info || info.gamesPlayed === 0
							const isProvisional = info?.isProvisional ?? true

							return (
								<div key={cat.key} className={profileStyles.ratingCard}>
									<div className={profileStyles.ratingCardHeader}>
										<div className={profileStyles.ratingCategory}>
											<span className={profileStyles.categoryIcon}>{cat.icon}</span>
											<div>
												<div className={profileStyles.categoryName}>{cat.name}</div>
												<div className={profileStyles.categoryTime}>{cat.time}</div>
											</div>
										</div>
										{isNotPlayed ? (
											<span className={`${profileStyles.badge} ${profileStyles.badgeNotPlayed}`}>
												{t('not_played', 'Not played')}
											</span>
										) : isProvisional ? (
											<span className={`${profileStyles.badge} ${profileStyles.badgeCalibrating}`}>
												{t('calibrating', 'Calibrating')} ({info.gamesPlayed}/5)
											</span>
										) : (
											<span className={`${profileStyles.badge} ${profileStyles.badgeActive}`}>
												{Math.round((info.wins / info.gamesPlayed) * 100)}% {t('win_rate', 'Win rate')}
											</span>
										)}
									</div>

									<div className={profileStyles.ratingValueRow}>
										<div
											className={`${profileStyles.ratingNumber} ${
												isNotPlayed
													? profileStyles.ratingNumberUnrated
													: isProvisional
													? profileStyles.ratingNumberProvisional
													: ''
											}`}
										>
											{isNotPlayed ? '—' : isProvisional ? `~${info.rating}` : info.rating}
										</div>
									</div>

									<div className={profileStyles.ratingStatsRow}>
										<div className={profileStyles.wdlRecord}>
											<span className={profileStyles.wins}>{info?.wins ?? 0}{t('wins_short', 'W')}</span>
											<span>/</span>
											<span className={profileStyles.draws}>{info?.draws ?? 0}{t('draws_short', 'D')}</span>
											<span>/</span>
											<span className={profileStyles.losses}>{info?.losses ?? 0}{t('losses_short', 'L')}</span>
										</div>
										<span className={profileStyles.gamesCount}>
											{info?.gamesPlayed ?? 0} {t('games_played', 'games')}
										</span>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}

			{activeTab === 'games' && username && (
				<GamesList
					matches={history.matches}
					username={username}
					isOwnProfile={isOwnProfile}
					loading={history.loading}
					getOutcome={history.getOutcome}
					formatDate={history.formatDate}
					formatReason={history.formatReason}
					onSelectGame={handleSelectGame}
				/>
			)}

			{activeTab === 'friends' && (
				<FriendsList
					friends={friends}
					onOpenProfile={onFriendClick}
				/>
			)}
		</>
	)
}

export default ProfileTabs