import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LayoutContextType } from '../layouts/MainLayout'
import './Home.css'

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
	{ id: 'bullet',   emoji: '🔥', label: 'Bullet',   time: '1 min',   desc: 'Fast and explosive' },
	{ id: 'bullet+2', emoji: '🔥', label: 'Bullet',   time: '1 | +2s', desc: 'Fast with increment', increment: '+2' },
	{ id: 'blitz',    emoji: '⚡', label: 'Blitz',    time: '3 min',   desc: 'Standard rapid action' },
	{ id: 'blitz+2',  emoji: '⚡', label: 'Blitz',    time: '3 | +2s', desc: 'Blitz with increment', increment: '+2' },
	{ id: 'rapid',    emoji: '⏳', label: 'Rapid',    time: '10 min',  desc: 'Strategic classical' },
	{ id: 'rapid+2',  emoji: '⏳', label: 'Rapid',    time: '10 | +2s',desc: 'Rapid with increment', increment: '+2' },
]

function Home() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<User[]>([])
	const [showResults, setShowResults] = useState(false)
	const [isSearching, setIsSearching] = useState(false)
	const {currentUser} = useOutletContext<LayoutContextType>();

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
				return <span className="status-dot online"></span>
			case 'INGAME':
				return <span className="status-dot ingame"></span>
			default:
				return <span className="status-dot offline"></span>
		}
	}

	const handlePlayMode = (mode: GameMode) => {
		navigate(`/game?mode=${encodeURIComponent(mode)}`)
	}

	return (
		<div className="home-container">
			<main className="main-content">
				<div className="content-header">
					<h1>{t('welcome', { username: currentUser?.username || 'Player' })}</h1>
					<p className="content-subtitle">{t('home_subtitle', 'Select a game mode and jump straight into a match')}</p>
				</div>

				{/* Central Search Section */}
				<div className="home-search-section">
					<div className="home-search-container">
						<span className="home-search-icon">🔍</span>
						<input
							type="text"
							placeholder={t('search_placeholder', 'Search players...')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="home-search-input"
						/>
						{isSearching && <span className="home-search-spinner"></span>}

						{showResults && searchResults.length > 0 && (
							<div className="home-search-results">
								{searchResults.map((user) => (
									<div
										key={user.username}
										className="home-search-result-item"
										onClick={() => handleUserClick(user.username)}
									>
										<img
											src={user.avatar ? `/uploads/${user.avatar}` : `/assets/default.jpg`}
											alt={user.username}
											className="home-search-result-avatar"
										/>
										<div className="home-search-result-info">
											<div className="home-search-result-name">{user.username}</div>
											{user.bio && <div className="home-search-result-bio">{user.bio}</div>}
										</div>
										{getStatusDot(user.status)}
									</div>
								))}
							</div>
						)}

						{showResults && searchResults.length === 0 && searchQuery && (
							<div className="home-search-results empty">
								{t('no_users_found', 'No users found')}
							</div>
						)}
					</div>
				</div>

				<div className="home-modes-grid">
					{MODES.map((mode) => (
						<button
							key={mode.id}
							className={`home-mode-card home-mode-${mode.id.replace('+2', '-inc')}`}
							onClick={() => handlePlayMode(mode.id)}
						>
							<div className="home-mode-top">
								<span className="home-mode-emoji">{mode.emoji}</span>
								{mode.increment && (
									<span className="home-mode-inc-badge">+2s / move</span>
								)}
							</div>
							<div className="home-mode-label">{mode.label}</div>
							<div className="home-mode-time">{mode.time}</div>
							<div className="home-mode-desc">{mode.desc}</div>
							<div className="home-mode-play">Play ⚔️</div>
						</button>
					))}
				</div>
			</main>
		</div>
	)
}

export default Home
