import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LayoutContextType } from '../../layouts/MainLayout'
import { useToast } from '../../context/ToastContext'
import { useGameHistory } from '../../hooks/useGameHistory'
import { usePageTitle } from '../../hooks/usePageTitle'
import GameModesGrid from '../../components/GameModesGrid/GameModesGrid'
import ChallengeSection from '../../components/ChallengeSection/ChallengeSection'
import GameReviewCard from '../../components/GameReviewCard/GameReviewCard'
import HomeRecentGames from '../../components/HomeRecentGames/HomeRecentGames'
import PlayerRatingsCard from '../../components/PlayerRatingsCard/PlayerRatingsCard'
import FriendsPreview from '../../components/FriendsPreview/FriendsPreview'
import type { GameModeType, ModeItem } from '../../constants/gameModeConstats'
import type { User } from '../../constants/profileConstants'
import styles from './HomePage.module.css'

function HomePage() {
	const { t } = useTranslation()
	usePageTitle('page_title_home', 'Home')
	const { toast } = useToast()
	const navigate = useNavigate()
	const { currentUser, challengeSocket } = useOutletContext<LayoutContextType>()

	const [challengeActive, setChallengeActive] = useState(false)
	const [selectedFriend, setSelectedFriend] = useState('')
	const [friends, setFriends] = useState<User[]>([])
	const [ratings, setRatings] = useState(currentUser?.ratings || null)

	const history = useGameHistory(currentUser?.username || '')

	// Load ratings & friends list
	useEffect(() => {
		if (!currentUser) return
		const token = localStorage.getItem('token')

		fetch(`/api/friends/list/${currentUser.username}`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(res => res.ok ? res.json() : [])
			.then(data => setFriends(data))
			.catch(err => console.error('Failed to load friends:', err))

		fetch(`/api/game/ratings/${currentUser.username}`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(res => res.ok ? res.json() : null)
			.then(data => {
				if (data) setRatings(data)
			})
			.catch(err => console.error('Failed to load ratings:', err))
	}, [currentUser])

	// Listen to real-time friend status updates
	useEffect(() => {
		const handleStatusChange = (e: Event) => {
			const customEvent = e as CustomEvent<{ userId: number; username: string; status: string }>
			const data = customEvent.detail
			if (!data) return

			setFriends(prev =>
				prev.map(friend => {
					if (friend.id === data.userId || friend.username?.toLowerCase() === data.username?.toLowerCase()) {
						return { ...friend, status: data.status }
					}
					return friend
				})
			)
		}

		window.addEventListener('user_status_changed', handleStatusChange)
		return () => {
			window.removeEventListener('user_status_changed', handleStatusChange)
		}
	}, [])

	const challengeFriends = useMemo(() => {
		return friends.map(f => ({
			username: f.username,
			avatar: f.avatar || null,
		}))
	}, [friends])

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
		{ id: 'bullet', emoji: '🔥', label: t('bullet'), time: t('time_1_min'), desc: t('bullet_desc') },
		{ id: 'blitz', emoji: '⚡', label: t('blitz'), time: t('time_3_min'), desc: t('blitz_desc') },
		{ id: 'rapid', emoji: '⏳', label: t('rapid'), time: t('time_10_min'), desc: t('strategic_classical') },
		{ id: 'bullet+2', emoji: '🔥', label: t('bullet'), time: t('time_1_inc'), desc: t('bullet_inc_desc'), increment: '+2' },
		{ id: 'blitz+2', emoji: '⚡', label: t('blitz'), time: t('time_3_inc'), desc: t('blitz_inc_desc'), increment: '+2' },
		{ id: 'rapid+2', emoji: '⏳', label: t('rapid'), time: t('time_10_inc'), desc: t('rapid_inc_desc'), increment: '+2' },
	]

	return (
		<div className={styles.homeContainer}>
			<main className={styles.mainContent}>
				<div className={styles.contentHeader}>
					<h1>{t('welcome', { username: currentUser?.username || t('player') })}</h1>
				</div>

				{/* Section 1: Play Online */}
				<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>
							<span>⚔️</span> {t('play_online', 'Play Online')}
						</h2>
					</div>

					<div className={styles.playOnlineLayout}>
						{/* Left subsection (70-80%): Challenge section & minimal game modes (without names) */}
						<div className={styles.playOnlineLeft}>
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
						<div className={styles.playOnlineRight}>
							<GameReviewCard
								games={history.matches}
								currentUsername={currentUser?.username}
								loading={history.loading}
							/>
						</div>
					</div>
				</section>

				{/* Section 2: Stats and More */}
				<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>
							<span>📊</span> {t('stats_and_more', 'Stats & More')}
						</h2>
					</div>

					<div className={styles.statsLayout}>
						{/* Left subsection (70%): Recent games list like in profile */}
						<div className={styles.statsLeft}>
							<HomeRecentGames
								matches={history.matches}
								username={currentUser?.username || ''}
								loading={history.loading}
							/>
						</div>

						{/* Right subsection (30%): Stacked ratings on top and friends on bottom */}
						<div className={styles.statsRight}>
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
	)
}

export default HomePage