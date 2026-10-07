import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import profileStyles from './ProfileTabs.module.css';
import type { TabType, User } from '../../utils/profileUtils';
import { useGameHistory } from '../../hooks/useGameHistory';
import { useRatingHistory } from '../../hooks/useRatingHistory';
import FriendsList from '../FriendsList/FriendsList';
import GamesList from '../GamesList/GamesList';
import MiniRatingChart from '../MiniRatingChart/MiniRatingChart';
import FriendsPreview from '../FriendsPreview/FriendsPreview';
import GameRow from '../GameRow/GameRow';
import type { MatchRecord, RatingCategory } from '../../utils/gameUtils';

type Props = {
	activeTab: TabType;
	friends: User[];
	username?: string;
	isOwnProfile: boolean;
	ratings?: User['ratings'];
	historyData?: ReturnType<typeof useGameHistory>;
	onSelectTab: (tab: TabType) => void;
	onFriendClick: (targetUsername: string) => void;
};

const ProfileTabs = ({
	activeTab,
	username,
	friends,
	isOwnProfile,
	ratings,
	historyData,
	onSelectTab,
	onFriendClick,
}: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	// Load match history for games and rating computations
	const internalHistory = useGameHistory(username || '');
	const history = historyData || internalHistory;
	const ratingData = useRatingHistory(history.matches, username || '', ratings);

	const handleSelectGame = (match: MatchRecord) => {
		navigate(`/game/analysis/${match.id}`, {
			state: { match, fromUsername: username },
		});
	};

	const handleChartClick = (mode: RatingCategory) => {
		if (username) {
			navigate(`/profile/${username}/rating?mode=${mode}`);
		}
	};

	const recentMatches = history.matches.slice(0, 6);

	return (
		<div className={profileStyles.tabsWrapper}>
			{/* Overview Tab Content */}
			{activeTab === 'overview' && (
				<div className={profileStyles.overviewSection}>
					<div className={profileStyles.ratingsSection}>
						<div className={profileStyles.sectionHeader}>
							<h3 className={profileStyles.sectionTitle}>
								{t('rating_overview_header')}
							</h3>
						</div>

						<div className={profileStyles.ratingsGrid}>
							<MiniRatingChart
								mode="bullet"
								history={ratingData.bullet}
								onClick={() => handleChartClick('bullet')}
							/>
							<MiniRatingChart
								mode="blitz"
								history={ratingData.blitz}
								onClick={() => handleChartClick('blitz')}
							/>
							<MiniRatingChart
								mode="rapid"
								history={ratingData.rapid}
								onClick={() => handleChartClick('rapid')}
							/>
						</div>
					</div>

					<FriendsPreview
						friends={friends}
						onFriendClick={onFriendClick}
						onSeeAll={() => onSelectTab('friends')}
					/>

					{/* Recent Games List (Last 5-7 games played) */}
					<div className={profileStyles.recentGamesCard}>
						<div className={profileStyles.recentGamesHeader}>
							<div className={profileStyles.titleGroup}>
								<h3 className={profileStyles.sectionTitle}>
									{t('recent_games')}
								</h3>
								<span className={profileStyles.countBadge}>
									{history.matches.length}
								</span>
							</div>

							{history.matches.length > 0 && (
								<button
									className={profileStyles.seeAllBtn}
									onClick={() => onSelectTab('games')}
									type="button"
								>
									{t('see_all')} →
								</button>
							)}
						</div>

						{history.loading ? (
							<div className={profileStyles.emptyCard}>
								<span className={profileStyles.spinnerIcon}>♟</span>
								<p className={profileStyles.emptySubtitle}>
									{t('loading')}
								</p>
							</div>
						) : recentMatches.length === 0 ? (
							<div className={profileStyles.emptyCard}>
								<div className={profileStyles.emptyIcon}>♟️</div>
								<h4 className={profileStyles.emptyTitle}>
									{t('no_games_yet')}
								</h4>
								<p className={profileStyles.emptySubtitle}>
									{isOwnProfile
										? t('play_first_game_prompt')
										: t('user_no_games')}
								</p>
								{isOwnProfile && (
									<button
										className={profileStyles.playNowBtn}
										onClick={() => navigate('/home')}
										type="button"
									>
										⚔️ {t('play_now')}
									</button>
								)}
							</div>
						) : (
							<div className={profileStyles.gamesListRows}>
								<div className={profileStyles.listHeader}>
									<span>{t('mode')}</span>
									<span>{t('players')}</span>
									<span>{t('moves')}</span>
									<span>{t('result')}</span>
									<span>{t('review')}</span>
									<span>{t('date')}</span>
								</div>

								<div className={profileStyles.rowsContainer}>
									{recentMatches.map((match) => (
										<GameRow
											key={match.id}
											match={match}
											username={username || ''}
											onSelect={handleSelectGame}
											onRowClick={(m) => navigate(`/game/${m.id}`)}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Games Tab Content */}
			{activeTab === 'games' && username && (
				<GamesList
					matches={history.matches}
					username={username}
					isOwnProfile={isOwnProfile}
					loading={history.loading}
					onSelectGame={handleSelectGame}
				/>
			)}

			{/* Friends Tab Content */}
			{activeTab === 'friends' && (
				<FriendsList
					friends={friends}
					onOpenProfile={onFriendClick}
				/>
			)}
		</div>
	);
};

export default ProfileTabs;