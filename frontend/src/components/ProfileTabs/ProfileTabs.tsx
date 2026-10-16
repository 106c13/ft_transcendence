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
import RecentGames from '../RecentGames/RecentGames';
import type { RatingCategory } from '../../utils/gameUtils';

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

	const handleChartClick = (mode: RatingCategory) => {
		if (username) {
			navigate(`/profile/${username}/rating?mode=${mode}`);
		}
	};

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

					{/* Recent Games List */}
					<RecentGames
						matches={history.matches}
						username={username || ''}
						isOwnProfile={isOwnProfile}
						loading={history.loading}
					/>
				</div>
			)}

			{/* Games Tab Content */}
			{activeTab === 'games' && username && (
				<GamesList
					matches={history.matches}
					username={username}
					isOwnProfile={isOwnProfile}
					loading={history.loading}
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