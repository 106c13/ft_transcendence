import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

type User = {
	username: string
	email: string
	avatar?: string
	bio?: string
	status?: 'ONLINE' | 'OFFLINE' | 'INGAME'
}

function Home() {
	const navigate = useNavigate()
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<User[]>([])
	const [showResults, setShowResults] = useState(false)
	const [isSearching, setIsSearching] = useState(false)
	const [currentUser, setCurrentUser] = useState<User | null>(null)
	const [recentGames, setRecentGames] = useState<any[]>([])
	const [onlineFriends, setOnlineFriends] = useState<User[]>([])

	// Load current user data
	useEffect(() => {
		const loadCurrentUser = async () => {
			const token = localStorage.getItem('token')
			if (!token) {
				navigate('/login')
				return
			}

			try {
				const res = await fetch('/api/users/me', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				if (res.ok) {
					const data = await res.json()
					setCurrentUser(data)
				} else {
					localStorage.removeItem('token')
					navigate('/login')
				}
			} catch (error) {
				console.error('Error loading user:', error)
			}
		}

		loadCurrentUser()
		loadRecentGames()
		loadOnlineFriends()
	}, [navigate])

	const loadRecentGames = async () => {
		// Fetch recent games from your API
		try {
			const token = localStorage.getItem('token')
			const res = await fetch('/api/games/recent', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (res.ok) {
				const data = await res.json()
				setRecentGames(data)
			}
		} catch (error) {
			console.error('Error loading games:', error)
		}
	}

	const loadOnlineFriends = async () => {
		// Fetch online friends
		try {
			const token = localStorage.getItem('token')
			const res = await fetch('/api/friends/online', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (res.ok) {
				const data = await res.json()
				setOnlineFriends(data)
			}
		} catch (error) {
			console.error('Error loading friends:', error)
		}
	}

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
				headers: {
					Authorization: `Bearer ${token}`,
				},
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

	// Debounce search
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
		<div className="home-container">
			{/* Left Sidebar */}
			<aside className="sidebar">
				<div className="sidebar-header">
					<h2>ft_transcendence</h2>
				</div>

				<nav className="sidebar-nav">
					<div 
						className="nav-item active"
						onClick={() => navigate('/home')}
					>
						<span className="nav-icon">🏠</span>
						<span>Home</span>
					</div>

					<div 
						className="nav-item"
						onClick={() => navigate('/game')}
					>
						<span className="nav-icon">🎮</span>
						<span>Games</span>
					</div>
				</nav>

				{/* Search Section */}
				<div className="sidebar-search">
					<div className="search-container">
						<span className="search-icon">🔍</span>
						<input
							type="text"
							placeholder="Search a user"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="search-input"
						/>
						{isSearching && <span className="search-spinner"></span>}
						
						{/* Search Results Dropdown - MOVED INSIDE search-container */}
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
								No users found
							</div>
						)}
					</div>
				</div>
				{/* Current User Info */}
				{currentUser && (
					<div className="sidebar-footer">
						<div 
							className="current-user"
							onClick={() => navigate(`/profile/`)}
						>
							<img 
								src={currentUser.avatar || '/default-avatar.png'} 
								alt={currentUser.username}
								className="current-user-avatar"
							/>
							<div className="current-user-info">
								<div className="current-user-name">{currentUser.username}</div>
								<div className="current-user-status">
									{getStatusDot(currentUser.status)}
									<span>{currentUser.status || 'OFFLINE'}</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</aside>

			{/* Main Content */}
			<main className="main-content">
				<div className="content-header">
					<h1>Welcome back, {currentUser?.username || 'Player'}!</h1>
				</div>

				<div className="content-grid">
					{/* Online Friends Section */}
					<section className="content-section">
						<h2>Online Friends</h2>
						{onlineFriends.length > 0 ? (
							<div className="friends-grid">
								{onlineFriends.map((friend) => (
									<div 
										key={friend.username}
										className="friend-card"
										onClick={() => navigate(`/profile/${friend.username}`)}
									>
										<img 
											src={friend.avatar || '/default-avatar.png'} 
											alt={friend.username}
											className="friend-avatar-large"
										/>
										<div className="friend-name">{friend.username}</div>
										{getStatusDot(friend.status)}
										<button 
											className="challenge-btn"
											onClick={(e) => {
												e.stopPropagation()
												navigate(`/game?challenge=${friend.username}`)
											}}
										>
											Challenge
										</button>
									</div>
								))}
							</div>
						) : (
							<div className="empty-state">
								<p>No friends online</p>
								<button 
									className="add-friend-btn"
									onClick={() => {
										const searchInput = document.querySelector('.search-input') as HTMLInputElement;
										searchInput?.focus();
									}}
								>
									Add Friends
								</button>
							</div>
						)}
					</section>

					{/* Recent Games */}
					<section className="content-section">
						<h2>Recent Games</h2>
						{recentGames.length > 0 ? (
							<div className="games-list">
								{recentGames.map((game, index) => (
									<div key={index} className="game-item">
										<div className="game-players">
											<span>{game.player1}</span>
											<span>vs</span>
											<span>{game.player2}</span>
										</div>
										<div className="game-score">
											{game.score1} - {game.score2}
										</div>
										<div className="game-date">
											{new Date(game.date).toLocaleDateString()}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="empty-state">
								<p>No recent games</p>
								<button 
									className="play-now-btn"
									onClick={() => navigate('/game')}
								>
									Play Now
								</button>
							</div>
						)}
					</section>
				</div>
			</main>
		</div>
	)
}

export default Home
