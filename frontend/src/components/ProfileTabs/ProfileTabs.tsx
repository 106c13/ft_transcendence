import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import profileStyles from './ProfileTabs.module.css'
import commonStyles from '../../pages/Common.module.css'
import type { TabType, User } from '../../constants/profileConstants'
import FriendsList from '../FriendsList/FriendsList'

type Props = {
	activeTab: TabType
	friends: User[]
	username?: string
	onSelectTab: (tab: TabType) => void
	onFriendClick: (targetUsername: string) => void
}

function ProfileTabs({ activeTab, username, friends, onSelectTab, onFriendClick }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

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
					className={profileStyles.tab}
					onClick={() => username && navigate(`/profile/${username}/games`)}
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