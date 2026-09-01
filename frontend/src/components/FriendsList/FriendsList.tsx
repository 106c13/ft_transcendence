import { useTranslation } from 'react-i18next'
import type { User } from '../../pages/ProfilePage/Profile'
import styles from './FriendsList.module.css'

type Props = {
	friends: User[]
	onOpenProfile: (username: string) => void
}

function FriendsList({ friends, onOpenProfile }: Props) {
	const { t } = useTranslation()

	return (
		<div className={styles.friendsList}>
			{friends.length === 0 ? (
				<div className={styles.emptyFriends}>{t('no_friends_yet')}</div>
			) : (
				friends.map((friend) => (
					<div
						key={friend.username}
						className={styles.friendRow}
						onClick={() => onOpenProfile(friend.username)}
					>
						<img
							className={styles.friendAvatar}
							src={
								friend.avatar
									? `/uploads/${friend.avatar}`
									: `/assets/default.jpg`
							}
							alt="avatar"
						/>

						<div className={styles.friendName}>
							{friend.username}
						</div>
					</div>
				))
			)}
		</div>
	)
}

export default FriendsList
