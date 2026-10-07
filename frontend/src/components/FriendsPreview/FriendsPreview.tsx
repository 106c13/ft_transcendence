import { useTranslation } from 'react-i18next';
import { Users, ArrowRight } from 'lucide-react';
import type { User } from '../../utils/profileUtils';
import styles from './FriendsPreview.module.css';

type Props = {
	friends: User[];
	onFriendClick: (username: string) => void;
	onSeeAll: () => void;
};

const FriendsPreview = ({ friends, onFriendClick, onSeeAll }: Props) => {
	const { t } = useTranslation();
	const displayedFriends = friends.slice(0, 7);

	return (
		<div className={styles.friendsPreviewCard}>
			<div className={styles.header}>
				<div className={styles.titleGroup}>
					<h3 className={styles.title}>{t('friends_title')}</h3>
					<span className={styles.countBadge}>{friends.length}</span>
				</div>
				<button className={styles.seeAllBtn} onClick={onSeeAll} type="button">
					<span>{t('see_all')}</span>
					<ArrowRight size={14} aria-hidden="true" />
				</button>
			</div>

			{displayedFriends.length === 0 ? (
				<div className={styles.emptyState}>
					<Users size={32} className={styles.emptyIcon} aria-hidden="true" />
					<div className={styles.emptyTextGroup}>
						<span className={styles.emptyTitle}>{t('no_friends_yet')}</span>
						<span className={styles.emptySubtitle}>
							{t('add_friends_tip')}
						</span>
					</div>
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
								src={friend.avatar && friend.avatar !== 'default.jpg' ? `/uploads/${friend.avatar}` : '/assets/default.jpg'}
								alt={friend.username}
								className={styles.avatarImg}
								onError={(e) => {
									const target = e.currentTarget;
									if (!target.src.endsWith('/assets/default.jpg')) {
										target.src = '/assets/default.jpg';
									}
								}}
							/>
							<span
								className={`${styles.statusDot} ${
									friend.status === 'ONLINE'
										? styles.online
										: friend.status === 'INGAME'
										? styles.ingame
										: styles.offline
								}`}
							/>
							<div className={styles.tooltip}>{friend.username}</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default FriendsPreview;

