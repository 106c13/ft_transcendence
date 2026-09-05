import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import profileStyles from './ProfileTabs.module.css'
import commonStyles from '../../pages/Common.module.css'
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
	onSelectTab: (tab: TabType) => void
	onFriendClick: (targetUsername: string) => void
}

function ProfileTabs({ activeTab, username, friends, isOwnProfile, onSelectTab, onFriendClick }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const history = useGameHistory(activeTab === 'games' && username ? username : '')

	const handleSelectGame = (match: MatchRecord) => {
		navigate(`/game/analysis/${match.id}`, {
			state: { match, fromUsername: username },
		})
	}

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
				<div className={commonStyles.profileContent}>{t('overview_content')}</div>
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