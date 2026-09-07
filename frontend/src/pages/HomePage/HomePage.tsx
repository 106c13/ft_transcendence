import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LayoutContextType } from '../../layouts/MainLayout'
import GameModesGrid from '../../components/GameModesGrid/GameModesGrid'
import ChallengeSection from '../../components/ChallengeSection/ChallengeSection'
import type { GameModeType, ModeItem } from '../../constants/gameModeConstats'
import styles from './HomePage.module.css'

const MODES: ModeItem[] = [
	{ id: 'bullet', emoji: '🔥', label: 'Bullet', time: '1 min', desc: 'Fast and explosive' },
	{ id: 'bullet+2', emoji: '🔥', label: 'Bullet', time: '1 | +2s', desc: 'Fast with increment', increment: '+2' },
	{ id: 'blitz', emoji: '⚡', label: 'Blitz', time: '3 min', desc: 'Standard rapid action' },
	{ id: 'blitz+2', emoji: '⚡', label: 'Blitz', time: '3 | +2s', desc: 'Blitz with increment', increment: '+2' },
	{ id: 'rapid', emoji: '⏳', label: 'Rapid', time: '10 min', desc: 'Strategic classical' },
	{ id: 'rapid+2', emoji: '⏳', label: 'Rapid', time: '10 | +2s', desc: 'Rapid with increment', increment: '+2' },
]

type Friend = {
	username: string
	avatar: string | null
}

function HomePage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { currentUser, challengeSocket } = useOutletContext<LayoutContextType>()

	const [challengeActive, setChallengeActive] = useState(false)
	const [selectedFriend, setSelectedFriend] = useState('')
	const [friends, setFriends] = useState<Friend[]>([])
	const [errorMessage, setErrorMessage] = useState('')

	// Reset challenge status when entering HomePage so returning from a game won't show stale status
	useEffect(() => {
		challengeSocket.resetChallengeStatus()
	}, [])

	// Load friends list
	useEffect(() => {
		if (!currentUser) return
		const token = localStorage.getItem('token')
		fetch(`/api/friends/list/${currentUser.username}`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(res => res.json())
			.then(data => setFriends(data))
			.catch(err => console.error('Failed to load friends:', err))
	}, [currentUser])

	const handlePlayMode = (mode: GameModeType) => {
		if (challengeActive) {
			if (!selectedFriend) {
				setErrorMessage(t('select_friend_error', 'Please select a friend first before choosing a game mode.'))
				setTimeout(() => setErrorMessage(''), 3000)
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
			setErrorMessage('')
			challengeSocket.resetChallengeStatus()
		}
	}

	return (
		<div className={styles.homeContainer}>
			<main className={styles.mainContent}>
				<div className={styles.contentHeader}>
					<h1>{t('welcome', { username: currentUser?.username || 'Player' })}</h1>
					<p className={styles.contentSubtitle}>
						{t('home_subtitle', 'Select a game mode and jump straight into a match')}
					</p>
				</div>

				<ChallengeSection
					active={challengeActive}
					onToggle={handleToggleChallenge}
					selectedFriend={selectedFriend}
					onSelectFriend={setSelectedFriend}
					friends={friends}
					challengeStatus={challengeSocket.challengeStatus}
					challengeError={challengeSocket.challengeError}
				/>

				<GameModesGrid modes={MODES} onSelectMode={handlePlayMode} />

				{errorMessage && (
					<div className={styles.errorToast}>
						{errorMessage}
					</div>
				)}
			</main>
		</div>
	)
}

export default HomePage