import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LayoutContextType } from '../../layouts/MainLayout'
import styles from './Home.module.css'

type User = {
	id: number
	username: string
	email: string
	avatar?: string
	bio?: string
	status?: 'ONLINE' | 'OFFLINE' | 'INGAME'
}

type GameMode = 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'

const MODES: { id: GameMode; emoji: string; label: string; time: string; desc: string; increment?: string }[] = [
	{ id: 'bullet', emoji: '🔥', label: 'Bullet', time: '1 min', desc: 'Fast and explosive' },
	{ id: 'bullet+2', emoji: '🔥', label: 'Bullet', time: '1 | +2s', desc: 'Fast with increment', increment: '+2' },
	{ id: 'blitz', emoji: '⚡', label: 'Blitz', time: '3 min', desc: 'Standard rapid action' },
	{ id: 'blitz+2', emoji: '⚡', label: 'Blitz', time: '3 | +2s', desc: 'Blitz with increment', increment: '+2' },
	{ id: 'rapid', emoji: '⏳', label: 'Rapid', time: '10 min', desc: 'Strategic classical' },
	{ id: 'rapid+2', emoji: '⏳', label: 'Rapid', time: '10 | +2s', desc: 'Rapid with increment', increment: '+2' },
]

const modeClassMap: Record<GameMode, keyof typeof styles> = {
	'bullet': 'homeModeBullet',
	'bullet+2': 'homeModeBulletInc',
	'blitz': 'homeModeBlitz',
	'blitz+2': 'homeModeBlitzInc',
	'rapid': 'homeModeRapid',
	'rapid+2': 'homeModeRapidInc',
}

function Home() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<User[]>([])
	const [showResults, setShowResults] = useState(false)
	const [isSearching, setIsSearching] = useState(false)
	const { currentUser } = useOutletContext<LayoutContextType>();

	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			setSearchResults([])
			setShowResults(false)
			return
		}

		setIsSearching(true)
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
				headers: { Authorization: `Bearer ${token}` },
			})

			if (res.ok) {
				const data = await res.json()
				setSearchResults(data)
				setShowResults(true)
			}
		} catch (error) {
			console.error('Search error:', error)
		} finally {
			setIsSearching(false)
		}
	}

	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchQuery) {
				handleSearch()
			} else {
				setShowResults(false)
			}
		}, 300)
		return () => clearTimeout(timer)
	}, [searchQuery])

	const handleUserClick = (username: string) => {
		setShowResults(false)
		setSearchQuery('')
		navigate(`/profile/${username}`)
	}

	const getStatusDot = (status?: string) => {
		switch (status) {
			case 'ONLINE':
				return <span className={`${styles.statusDot} ${styles.online}`}></span>
			case 'INGAME':
				return <span className={`${styles.statusDot} ${styles.ingame}`}></span>
			default:
				return <span className={`${styles.statusDot} ${styles.offline}`}></span>
		}
	}

	const handlePlayMode = (mode: GameMode) => {
		navigate(`/game?mode=${encodeURIComponent(mode)}`)
	}

	return (
		<div className={styles.homeContainer}>
			<main className={styles.mainContent}>
				<div className={styles.contentHeader}>
					<h1>{t('welcome', { username: currentUser?.username || 'Player' })}</h1>
					<p className={styles.contentSubtitle}>{t('home_subtitle', 'Select a game mode and jump straight into a match')}</p>
				</div>

				{/* Central Search Section */}
				<div className={styles.homeSearchSection}>
					<div className={styles.homeSearchContainer}>
						<span className={styles.homeSearchIcon}>🔍</span>
						<input
							type="text"
							placeholder={t('search_placeholder', 'Search players...')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className={styles.homeSearchInput}
						/>
						{isSearching && <span className={styles.homeSearchSpinner}></span>}

						{showResults && searchResults.length > 0 && (
							<div className={styles.homeSearchResults}>
								{searchResults.map((user) => (
									<div
										key={user.username}
										className={styles.homeSearchResultItem}
										onClick={() => handleUserClick(user.username)}
									>
										<img
											src={user.avatar ? `/uploads/${user.avatar}` : `/assets/default.jpg`}
											alt={user.username}
											className={styles.homeSearchResultAvatar}
										/>
										<div className={styles.homeSearchResultInfo}>
											<div className={styles.homeSearchResultName}>{user.username}</div>
											{user.bio && <div className={styles.homeSearchResultBio}>{user.bio}</div>}
										</div>
										{getStatusDot(user.status)}
									</div>
								))}
							</div>
						)}

						{showResults && searchResults.length === 0 && searchQuery && (
							<div className={`${styles.homeSearchResults} ${styles.empty}`}>
								{t('no_users_found', 'No users found')}
							</div>
						)}
					</div>
				</div>

				<div className={styles.homeModesGrid}>
					{MODES.map((mode) => (
						<button
							key={mode.id}
							className={`${styles.homeModeCard} ${styles[modeClassMap[mode.id]]}`}
							onClick={() => handlePlayMode(mode.id)}
						>
							<div className={styles.homeModeTop}>
								<span className={styles.homeModeEmoji}>{mode.emoji}</span>
								{mode.increment && (
									<span className={styles.homeModeIncBadge}>+2s / move</span>
								)}
							</div>
							<div className={styles.homeModeLabel}>{mode.label}</div>
							<div className={styles.homeModeTime}>{mode.time}</div>
							<div className={styles.homeModeDesc}>{mode.desc}</div>
							<div className={styles.homeModePlay}>Play ⚔️</div>
						</button>
					))}
				</div>
			</main>
		</div>
	)
}

export default Home