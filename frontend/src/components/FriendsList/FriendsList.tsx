import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '../../constants/profileConstants'
import styles from './FriendsList.module.css'

type Props = {
	friends: User[]
	onOpenProfile: (username: string) => void
}

export default function FriendsList({ friends, onOpenProfile }: Props) {
	const { t } = useTranslation()
	const [searchQuery, setSearchQuery] = useState('')

	const filteredFriends = useMemo(() => {
		if (!searchQuery.trim()) return friends
		const q = searchQuery.toLowerCase().trim()
		return friends.filter((f) => f.username.toLowerCase().includes(q))
	}, [friends, searchQuery])

	return (
		<div className={styles.container}>
			<div className={styles.topBar}>
				<div className={styles.titleGroup}>
					<h3 className={styles.title}>{t('friends_title', 'Friends')}</h3>
					<span className={styles.countBadge}>{friends.length}</span>
				</div>

				{friends.length > 0 && (
					<input
						type="text"
						className={styles.searchInput}
						placeholder={t('search_friends', 'Search friends...')}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				)}
			</div>

			{friends.length === 0 ? (
				<div className={styles.emptyCard}>
					<div className={styles.emptyIcon}>👥</div>
					<h4 className={styles.emptyTitle}>{t('no_friends_yet', 'No friends yet')}</h4>
					<p className={styles.emptySubtitle}>
						{t('add_friends_tip', 'Visit player profiles to send friend requests.')}
					</p>
				</div>
			) : filteredFriends.length === 0 ? (
				<div className={styles.emptyCard}>
					<div className={styles.emptyIcon}>🔍</div>
					<h4 className={styles.emptyTitle}>{t('no_friends_matching_query', 'No friends match your search')}</h4>
					<p className={styles.emptySubtitle}>
						{t('try_different_search', 'Try searching for another username.')}
					</p>
					<button
						className={styles.resetBtn}
						onClick={() => setSearchQuery('')}
						type="button"
					>
						✕ {t('clear', 'Clear Search')}
					</button>
				</div>
			) : (
				<div className={styles.friendsGrid}>
					{filteredFriends.map((friend) => (
						<div
							key={friend.username}
							className={styles.friendCard}
							onClick={() => onOpenProfile(friend.username)}
							role="button"
							tabIndex={0}
						>
							<div className={styles.friendIdentity}>
								<div className={styles.avatarWrapper}>
									<img
										className={styles.friendAvatar}
										src={
											friend.avatar
												? `/uploads/${friend.avatar}`
												: `/assets/default.jpg`
										}
										alt={friend.username}
									/>
									<span
										className={`${styles.statusDot} ${
											friend.status === 'ONLINE'
												? styles.online
												: friend.status === 'INGAME'
												? styles.ingame
												: styles.offline
										}`}
										title={
											friend.status === 'ONLINE'
												? t('online', 'Online')
												: friend.status === 'INGAME'
												? t('in_game', 'In Game')
												: t('offline', 'Offline')
										}
									/>
								</div>
								<div className={styles.friendInfo}>
									<span className={styles.friendName}>{friend.username}</span>
									{friend.ratings?.blitz?.rating && (
										<span className={styles.friendRating}>
											⚡ {friend.ratings.blitz.rating}
										</span>
									)}
								</div>
							</div>

							<span className={styles.arrowIndicator}>→</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
