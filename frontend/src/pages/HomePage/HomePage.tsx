import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swords, BarChart3 } from 'lucide-react';
import type { LayoutContextType } from '../../utils/layoutContextUtils';
import { useToast } from '../../context/ToastContext';
import { useGameHistory } from '../../hooks/useGameHistory';
import { usePageTitle } from '../../hooks/usePageTitle';
import GameModesGrid from '../../components/GameModesGrid/GameModesGrid';
import ChallengeSection from '../../components/ChallengeSection/ChallengeSection';
import GameReviewCard from '../../components/GameReviewCard/GameReviewCard';
import RecentGames from '../../components/RecentGames/RecentGames';
import PlayerRatingsCard from '../../components/PlayerRatingsCard/PlayerRatingsCard';
import FriendsPreview from '../../components/FriendsPreview/FriendsPreview';
import type { GameModeType, ModeItem } from '../../utils/gameModeUtils';
import styles from './HomePage.module.css';

const HomePage = () => {
	const { t } = useTranslation()
	usePageTitle('page_title_home')
	const { toast } = useToast()
	const navigate = useNavigate()
	const { currentUser, challengeSocket, friendSocket } = useOutletContext<LayoutContextType>()
	const friends = friendSocket.friends

	const [challengeActive, setChallengeActive] = useState(false)
	const [selectedFriend, setSelectedFriend] = useState('')
	const [ratings, setRatings] = useState(currentUser?.ratings || null)

	const history = useGameHistory(currentUser?.username || '')

	// Load ratings & friends list
	useEffect(() => {
		if (!currentUser) return
		const token = localStorage.getItem('token')

		fetch(`/api/game/ratings/${currentUser.username}`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(res => res.ok ? res.json() : null)
			.then(data => {
				if (data) setRatings(data)
			})
			.catch(err => console.error('Failed to load ratings:', err))
	}, [currentUser])

	const challengeFriends = useMemo(() => {
		return friends.map(f => ({
			username: f.username,
			avatar: f.avatar || null,
			status: f.status,
		}));
	}, [friends]);

	const handlePlayMode = (mode: GameModeType) => {
		if (challengeActive) {
			if (!selectedFriend) {
				toast.error('select_friend_error')
				return
			}
			// Send challenge
			challengeSocket.sendChallenge(selectedFriend, mode)
		} else {
			navigate(`/game?mode=${encodeURIComponent(mode)}`)
		}
	}

	const handleToggleChallenge = () => {
		setChallengeActive(!challengeActive)
		if (challengeActive) {
			setSelectedFriend('')
			challengeSocket.resetChallengeStatus()
		}
	}

	const effectiveRatings = ratings || currentUser?.ratings || null

	const modes: ModeItem[] = [
		{ id: 'bullet', emoji: '', label: t('bullet'), time: t('time_1_min'), desc: t('bullet_desc') },
		{ id: 'blitz', emoji: '', label: t('blitz'), time: t('time_3_min'), desc: t('blitz_desc') },
		{ id: 'rapid', emoji: '', label: t('rapid'), time: t('time_10_min'), desc: t('strategic_classical') },
		{ id: 'bullet+2', emoji: '', label: t('bullet'), time: t('time_1_inc'), desc: t('bullet_inc_desc'), increment: '+2' },
		{ id: 'blitz+2', emoji: '', label: t('blitz'), time: t('time_3_inc'), desc: t('blitz_inc_desc'), increment: '+2' },
		{ id: 'rapid+2', emoji: '', label: t('rapid'), time: t('time_10_inc'), desc: t('rapid_inc_desc'), increment: '+2' },
	];

	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-slate-200 pt-16 box-border">
			<main className="flex-1 max-w-[1140px] w-full mx-auto px-4 min-[961px]:px-5 pb-7 min-[961px]:pb-9 box-border flex flex-col gap-5 min-[961px]:gap-[22px]">
				<div className={styles.contentHeader}>
					<h1>{t('welcome', { username: currentUser?.username || t('player') })}</h1>
				</div>

				{/* Section 1: Play Online */}
				<section className="flex flex-col gap-3 w-full">
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>
							<Swords size={20} aria-hidden="true" /> {t('play_online')}
						</h2>
					</div>

					<div className="grid grid-cols-1 min-[961px]:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-[18px] items-stretch w-full">
						{/* Left subsection (70-80%): Challenge section & minimal game modes (without names) */}
						<div className="flex flex-col gap-3 min-w-0 h-full">
							<ChallengeSection
								active={challengeActive}
								onToggle={handleToggleChallenge}
								selectedFriend={selectedFriend}
								onSelectFriend={setSelectedFriend}
								friends={challengeFriends}
							/>
							<GameModesGrid modes={modes} onSelectMode={handlePlayMode} />
						</div>

						{/* Right subsection (20-30%): Random review recommendation board */}
						<div className="flex flex-col min-w-0 w-full h-full">
							<GameReviewCard
								games={history.matches}
								currentUsername={currentUser?.username}
								loading={history.loading}
							/>
						</div>
					</div>
				</section>

				{/* Section 2: Stats and More */}
				<section className="flex flex-col gap-3 w-full">
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>
							<BarChart3 size={20} aria-hidden="true" /> {t('stats_and_more')}
						</h2>
					</div>

					<div className="grid grid-cols-1 min-[1121px]:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-[18px] items-stretch w-full">
						{/* Left subsection (70%): Recent games list like in profile */}
						<div className="flex flex-col min-w-0 h-full">
							<RecentGames
								matches={history.matches}
								username={currentUser?.username || ''}
								isOwnProfile={true}
								loading={history.loading}
							/>
						</div>

						{/* Right subsection (30%): Stacked ratings on top and friends on bottom */}
						<div className="flex flex-col gap-4 min-w-0 h-full">
							<PlayerRatingsCard
								ratings={effectiveRatings}
								username={currentUser?.username}
							/>
							<FriendsPreview
								friends={friends}
								onFriendClick={(targetUsername) => navigate(`/profile/${targetUsername}`)}
								onSeeAll={() => navigate(`/profile/${currentUser?.username}`, { state: { defaultTab: 'friends' } })}
							/>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
};

export default HomePage;