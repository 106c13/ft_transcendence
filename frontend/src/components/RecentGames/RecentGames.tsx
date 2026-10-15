import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RotateCw, ArrowRight } from 'lucide-react';
import type { MatchRecord } from '../../utils/gameUtils';
import GameRow from '../GameRow/GameRow';
import styles from './RecentGames.module.css';
import NoGamesPlayed from '../NoGamesPlayed/NoGamesPlayed';

type Props = {
	matches: MatchRecord[];
	username: string;
	isOwnProfile: boolean;
	loading?: boolean;
};

const RecentGames = ({ matches, username, isOwnProfile, loading }: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const recentMatches = matches.slice(0, 6);

	const handleSeeAll = () => {
		navigate(`/profile/${username}`, { state: { defaultTab: 'games' } });
	};

	return (
		<div className={styles.recentGamesCard}>
			<div className={styles.header}>
				<div className={styles.titleGroup}>
					<h3 className={styles.cardTitle}>{t('recent_games')}</h3>
					<span className={styles.countBadge}>{matches.length}</span>
				</div>

				{matches.length > 0 && (
					<button className={styles.seeAllBtn} onClick={handleSeeAll} type="button">
						<span>{t('see_all')}</span>
						<ArrowRight size={14} aria-hidden="true" />
					</button>
				)}
			</div>

			{loading ? (
				<div className={styles.emptyState}>
					<RotateCw size={24} className={styles.spinnerIcon} aria-hidden="true" />
					<p>{t('loading')}</p>
				</div>
			) : recentMatches.length === 0 ? (
				<NoGamesPlayed isOwnProfile={isOwnProfile} />
			) : (
				<div className={styles.gamesListRows}>
					<div className={styles.listHeader}>
						<span>{t('mode')}</span>
						<span>{t('players')}</span>
						<span>{t('moves')}</span>
						<span>{t('result')}</span>
						<span>{t('accuracy')}</span>
						<span>{t('date')}</span>
					</div>

					<div className={styles.rowsContainer}>
						{recentMatches.map((match) => (
							<GameRow
								key={match.id}
								match={match}
								username={username}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default RecentGames;

