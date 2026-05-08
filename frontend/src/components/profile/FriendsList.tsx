import { useTranslation } from 'react-i18next'
import type { User } from '../../pages/Profile'

type Props = {
	friends: User[]
	onOpenProfile: (username: string) => void
}

function FriendsList({ friends, onOpenProfile }: Props) {
	const { t } = useTranslation()

	return (
		<div className="friends-list">
			{friends.length === 0 ? (
				<div className="empty-friends">{t('no_friends_yet')}</div>
			) : (
				friends.map((friend) => (
					<div
						key={friend.username}
						className="friend-row"
						onClick={() => onOpenProfile(friend.username)}
					>
						<img
							className="friend-avatar"
							src={
								friend.avatar
									? `/uploads/${friend.avatar}`
									: `/assets/default.jpg`
							}
							alt="avatar"
						/>

						<div className="friend-name">
							{friend.username}
						</div>
					</div>
				))
			)}
		</div>
	)
}

export default FriendsList
