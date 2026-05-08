import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './LeftSidebar.css'

type Props = {
	searchQuery: string
	setSearchQuery: (query: string) => void
	searchResults: any[]
	showResults: boolean
	isSearching: boolean
	onUserClick: (username: string) => void
	getStatusDot: (status?: string) => React.ReactNode
}

function LeftSidebar({
	searchQuery,
	setSearchQuery,
	searchResults,
	showResults,
	isSearching,
	onUserClick,
	getStatusDot,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	return (
		<aside className="left-sidebar">
			<div className="sidebar-header">
				<h2>ft_transcendence</h2>
			</div>

			<nav className="sidebar-nav">
				<div 
					className="nav-item"
					onClick={() => navigate('/home')}
				>
					<span className="nav-icon">🏠</span>
					<span>{t('home')}</span>
				</div>

				<div 
					className="nav-item"
					onClick={() => navigate('/game')}
				>
					<span className="nav-icon">🎮</span>
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
									onClick={() => onUserClick(user.username)}
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
