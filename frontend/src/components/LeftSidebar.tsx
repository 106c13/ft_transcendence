import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './LeftSidebar.css'

type User = {
	id: number
	username: string
	email: string
	avatar?: string
	bio?: string
	status?: 'ONLINE' | 'OFFLINE' | 'INGAME'
}

function LeftSidebar() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<User[]>([])
	const [showResults, setShowResults] = useState(false)
	const [isSearching, setIsSearching] = useState(false)

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

	return (
		<aside className="left-sidebar">
			<div
				className="sidebar-header"
				onClick={() => navigate('/home')}
			>
				<h2>ft_transcendence</h2>
			</div>

			<nav className="sidebar-nav">
				<div 
					className="nav-item"
					onClick={() => navigate('/game')}
				>
					<span className="nav-icon">♟️</span>
					<span>{t('games')}</span>
				</div>
			</nav>

			<div className="sidebar-search">
				<div className="search-container">
					<span className="search-icon">🔍</span>
					<input
						type="text"
						placeholder={t('search_placeholder')}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="search-input"
					/>
					{isSearching && <span className="search-spinner"></span>}
					
					{showResults && searchResults.length > 0 && (
						<div className="search-results">
							{searchResults.map((user) => (
								<div
									key={user.username}
									className="search-result-item"
									onClick={() => handleUserClick(user.username)}
								>
									<img 
										src={user.avatar
												? `/uploads/${user.avatar}`
												: `/assets/default.jpg`
										} 
										alt={user.username}
										className="search-result-avatar"
									/>
									<div className="search-result-info">
										<div className="search-result-name">{user.username}</div>
										{user.bio && <div className="search-result-bio">{user.bio}</div>}
									</div>
									{getStatusDot(user.status)}
								</div>
							))}
						</div>
					)}

					{showResults && searchResults.length === 0 && searchQuery && (
						<div className="search-results empty">
							{t('no_users_found')}
						</div>
					)}
				</div>
			</div>

		</aside>
	)
}

export default LeftSidebar
