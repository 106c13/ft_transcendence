import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './PlayerSearch.module.css'

export type SearchUser = {
	id: number
	username: string
	email: string
	avatar?: string
	bio?: string
	status?: 'ONLINE' | 'OFFLINE' | 'INGAME'
}

function PlayerSearch() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [isExpanded, setIsExpanded] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<SearchUser[]>([])
	const [showResults, setShowResults] = useState(false)
	const [isSearching, setIsSearching] = useState(false)

	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Focus input when expanded
	useEffect(() => {
		if (isExpanded) {
			inputRef.current?.focus()
		}
	}, [isExpanded])

	// Click outside to collapse
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setShowResults(false)
				if (!searchQuery.trim()) {
					setIsExpanded(false)
				}
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [searchQuery])

	// Escape key to close
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setShowResults(false)
				setIsExpanded(false)
				setSearchQuery('')
			}
		}

		if (isExpanded) {
			document.addEventListener('keydown', handleKeyDown)
		}
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [isExpanded])

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
		setIsExpanded(false)
		navigate(`/profile/${username}`)
	}

	const handleBoxClick = () => {
		if (!isExpanded) {
			setIsExpanded(true)
		}
	}

	const handleClose = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (searchQuery) {
			setSearchQuery('')
			inputRef.current?.focus()
		} else {
			setIsExpanded(false)
			setShowResults(false)
		}
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

	return (
		<div
			ref={containerRef}
			className={styles.navSearchContainer}
		>
			<div
				className={`${styles.searchBox} ${isExpanded ? styles.expanded : ''}`}
				onClick={handleBoxClick}
				role="button"
				tabIndex={isExpanded ? -1 : 0}
				onKeyDown={(e) => {
					if (!isExpanded && (e.key === 'Enter' || e.key === ' ')) {
						setIsExpanded(true)
					}
				}}
				title={!isExpanded ? t('search_players', 'Search Players') : undefined}
			>
				<span className={styles.searchIcon}>🔍</span>
				<input
					ref={inputRef}
					type="text"
					placeholder={isExpanded ? t('search_placeholder', 'Search players...') : ''}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className={styles.navbarSearchInput}
					tabIndex={isExpanded ? 0 : -1}
				/>
				{isSearching && isExpanded && <span className={styles.searchSpinner}></span>}
				<button
					type="button"
					className={`${styles.searchCloseBtn} ${isExpanded ? styles.showClose : ''}`}
					onClick={handleClose}
					title={t('close', 'Close')}
					tabIndex={isExpanded ? 0 : -1}
				>
					✕
				</button>
			</div>

			{isExpanded && showResults && searchResults.length > 0 && (
				<div className={styles.navSearchResults}>
					{searchResults.map((user) => (
						<div
							key={user.username}
							className={styles.navSearchResultItem}
							onClick={() => handleUserClick(user.username)}
						>
							<img
								src={user.avatar ? `/uploads/${user.avatar}` : '/assets/default.jpg'}
								alt={user.username}
								className={styles.navSearchResultAvatar}
							/>
							<div className={styles.navSearchResultInfo}>
								<div className={styles.navSearchResultName}>{user.username}</div>
								{user.bio && <div className={styles.navSearchResultBio}>{user.bio}</div>}
							</div>
							{getStatusDot(user.status)}
						</div>
					))}
				</div>
			)}

			{isExpanded && showResults && searchResults.length === 0 && searchQuery && (
				<div className={`${styles.navSearchResults} ${styles.empty}`}>
					{t('no_users_found', 'No users found')}
				</div>
			)}
		</div>
	)
}

export default PlayerSearch
