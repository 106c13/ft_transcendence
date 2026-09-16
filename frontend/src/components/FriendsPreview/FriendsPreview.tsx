import { useTranslation } from 'react-i18next'
import type { User } from '../../constants/profileConstants'
import styles from './FriendsPreview.module.css'

type Props = {
	friends: User[]
	onFriendClick: (username: string) => void
	onSeeAll: () => void
}

export default function FriendsPreview({ friends, onFriendClick, onSeeAll }: Props) {
	const { t } = useTranslation()
	const displayedFriends = friends.slice(0, 7)

	return (
		<div className={styles.friendsPreviewCard}>
			<div className={styles.header}>
				<div className={styles.titleGroup}>
					<h3 className={styles.title}>{t('friends_title', 'Friends')}</h3>
					<span className={styles.countBadge}>{friends.length}</span>
				</div>
				<button className={styles.seeAllBtn} onClick={onSeeAll}>
					{t('see_all', 'See all')} →
				</button>
			</div>

			{displayedFriends.length === 0 ? (
				<div className={styles.emptyState}>
					{t('no_friends_yet', 'No friends yet')}
				</div>
			) : (
				<div className={styles.avatarsList}>
					{displayedFriends.map((friend) => (
						<div
							key={friend.username}
							className={styles.avatarItem}
							onClick={() => onFriendClick(friend.username)}
							role="button"
							tabIndex={0}
						>
							<img
								src={friend.avatar ? `/uploads/${friend.avatar}` : '/assets/default.jpg'}
								alt={friend.username}
								className={styles.avatarImg}
							/>
							<div className={styles.tooltip}>{friend.username}</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

