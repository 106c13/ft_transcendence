import { useTranslation } from 'react-i18next';
import TopRankBadge from '../TopRankBadge/TopRankBadge';
import type { LeaderboardPlayer } from '../../utils/leaderboardUtils';
import styles from '../../pages/LeaderboardPage/LeaderboardPage.module.css';

interface LeaderboardPodiumProps {
	podiumPlayers: {
		first: LeaderboardPlayer;
		second: LeaderboardPlayer;
		third: LeaderboardPlayer;
	} | null;
	onPlayerClick: (username: string) => void;
}

const LeaderboardPodium = ({
	podiumPlayers,
	onPlayerClick,
}: LeaderboardPodiumProps) => {
	const { t } = useTranslation();

	if (!podiumPlayers) return null;

	return (
		<section className={styles.podiumContainer} aria-label="Top 3 Champions">
			{/* 2nd Place */}
			<div
				className={`${styles.podiumCard} ${styles.podiumSecond}`}
				onClick={() => onPlayerClick(podiumPlayers.second.username)}
			>
				<div className={styles.podiumAvatarWrapper}>
					<img
						src={
							podiumPlayers.second.avatar && podiumPlayers.second.avatar !== 'default.jpg'
								? `/uploads/${podiumPlayers.second.avatar}`
								: '/assets/default.jpg'
						}
						alt={podiumPlayers.second.username}
						className={styles.podiumAvatar}
						onError={(e) => {
							e.currentTarget.src = '/assets/default.jpg';
						}}
					/>
					<span
						className={`${styles.podiumStatusDot} ${
							podiumPlayers.second.status === 'INGAME'
								? styles.statusIngame
								: podiumPlayers.second.status === 'ONLINE'
								? styles.statusOnline
								: styles.statusOffline
						}`}
					/>
				</div>
				<h3 className={styles.podiumUsername}>@{podiumPlayers.second.username}</h3>
				<div className={styles.podiumRatingRow}>
					<span className={styles.podiumRating}>{podiumPlayers.second.leaderboardRating}</span>
					<TopRankBadge rank={2} size="md" />
				</div>
				<div className={styles.podiumStatsRow}>
					<span>{podiumPlayers.second.stats.totalGames} {t('matches')}</span>
					<span className={styles.podiumStatHighlight}>
						{podiumPlayers.second.stats.winRate}% {t('winrate')}
					</span>
				</div>
			</div>

			{/* 1st Place */}
			<div
				className={`${styles.podiumCard} ${styles.podiumFirst}`}
				onClick={() => onPlayerClick(podiumPlayers.first.username)}
			>
				<div className={styles.podiumCrownWrapper}>
					<TopRankBadge rank={1} size="xl" showTooltip={false} />
				</div>
				<div className={styles.podiumAvatarWrapper}>
					<img
						src={
							podiumPlayers.first.avatar && podiumPlayers.first.avatar !== 'default.jpg'
								? `/uploads/${podiumPlayers.first.avatar}`
								: '/assets/default.jpg'
						}
						alt={podiumPlayers.first.username}
						className={styles.podiumAvatar}
						onError={(e) => {
							e.currentTarget.src = '/assets/default.jpg';
						}}
					/>
					<span
						className={`${styles.podiumStatusDot} ${
							podiumPlayers.first.status === 'INGAME'
								? styles.statusIngame
								: podiumPlayers.first.status === 'ONLINE'
								? styles.statusOnline
								: styles.statusOffline
						}`}
					/>
				</div>
				<h3 className={styles.podiumUsername}>@{podiumPlayers.first.username}</h3>
				<div className={styles.podiumRatingRow}>
					<span className={styles.podiumRating}>{podiumPlayers.first.leaderboardRating}</span>
					<TopRankBadge rank={1} size="md" />
				</div>
				<div className={styles.podiumStatsRow}>
					<span>{podiumPlayers.first.stats.totalGames} {t('matches')}</span>
					<span className={styles.podiumStatHighlight}>
						{podiumPlayers.first.stats.winRate}% {t('winrate')}
					</span>
				</div>
			</div>

			{/* 3rd Place */}
			<div
				className={`${styles.podiumCard} ${styles.podiumThird}`}
				onClick={() => onPlayerClick(podiumPlayers.third.username)}
			>
				<div className={styles.podiumAvatarWrapper}>
					<img
						src={
							podiumPlayers.third.avatar && podiumPlayers.third.avatar !== 'default.jpg'
								? `/uploads/${podiumPlayers.third.avatar}`
								: '/assets/default.jpg'
						}
						alt={podiumPlayers.third.username}
						className={styles.podiumAvatar}
						onError={(e) => {
							e.currentTarget.src = '/assets/default.jpg';
						}}
					/>
					<span
						className={`${styles.podiumStatusDot} ${
							podiumPlayers.third.status === 'INGAME'
								? styles.statusIngame
								: podiumPlayers.third.status === 'ONLINE'
								? styles.statusOnline
								: styles.statusOffline
						}`}
					/>
				</div>
				<h3 className={styles.podiumUsername}>@{podiumPlayers.third.username}</h3>
				<div className={styles.podiumRatingRow}>
					<span className={styles.podiumRating}>{podiumPlayers.third.leaderboardRating}</span>
					<TopRankBadge rank={3} size="md" />
				</div>
				<div className={styles.podiumStatsRow}>
					<span>{podiumPlayers.third.stats.totalGames} {t('matches')}</span>
					<span className={styles.podiumStatHighlight}>
						{podiumPlayers.third.stats.winRate}% {t('winrate')}
					</span>
				</div>
			</div>
		</section>
	);
};

export default LeaderboardPodium;
