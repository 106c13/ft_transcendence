import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, X, ArrowRight } from 'lucide-react';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import type { User } from '../../utils/profileUtils';
import styles from './FriendsList.module.css';

type Props = {
	friends: User[];
	onOpenProfile: (username: string) => void;
};

const FriendsList = ({ friends, onOpenProfile }: Props) => {
	const { t } = useTranslation();
	const [searchQuery, setSearchQuery] = useState('');

	const filteredFriends = useMemo(() => {
		if (!searchQuery.trim()) return friends
		const q = searchQuery.toLowerCase().trim()
		return friends.filter((f) => f.username.toLowerCase().includes(q))
	}, [friends, searchQuery])

	return (
		<div className={styles.container}>
			<div className={styles.topBar}>
				<div className={styles.titleGroup}>
					<h3 className={styles.title}>{t('friends_title')}</h3>
					<span className={styles.countBadge}>{friends.length}</span>
				</div>

				{friends.length > 0 && (
					<input
						type="text"
						className={styles.searchInput}
						placeholder={t('search_friends')}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				)}
			</div>

			{friends.length === 0 ? (
				<div className={styles.emptyCard}>
					<Users size={36} className={styles.emptyIcon} aria-hidden="true" />
					<h4 className={styles.emptyTitle}>{t('no_friends_yet')}</h4>
					<p className={styles.emptySubtitle}>
						{t('add_friends_tip')}
					</p>
				</div>
			) : filteredFriends.length === 0 ? (
				<div className={styles.emptyCard}>
					<Search size={36} className={styles.emptyIcon} aria-hidden="true" />
					<h4 className={styles.emptyTitle}>{t('no_friends_matching_query')}</h4>
					<p className={styles.emptySubtitle}>
						{t('try_different_search')}
					</p>
					<button
						className={styles.resetBtn}
						onClick={() => setSearchQuery('')}
						type="button"
					>
						<X size={14} aria-hidden="true" />
						<span>{t('clear')}</span>
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
												? t('online')
												: friend.status === 'INGAME'
												? t('in_game')
												: t('offline')
										}
									/>
								</div>
								<div className={styles.friendInfo}>
									<span className={styles.friendName}>{friend.username}</span>
									{friend.ratings?.blitz?.rating && (
										<span className={styles.friendRating}>
											<GameModeIcon mode="blitz" size={13} />
											<span>{friend.ratings.blitz.rating}</span>
										</span>
									)}
								</div>
							</div>

							<ArrowRight size={16} className={styles.arrowIndicator} aria-hidden="true" />
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default FriendsList;
