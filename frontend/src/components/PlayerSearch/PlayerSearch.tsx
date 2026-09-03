import { useEffect, useState } from 'react'
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
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<SearchUser[]>([])
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
				return <span className={`${styles.statusDot} ${styles.online}`}></span>
			case 'INGAME':
				return <span className={`${styles.statusDot} ${styles.ingame}`}></span>
			default:
				return <span className={`${styles.statusDot} ${styles.offline}`}></span>
		}
	}

	return (
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
	)
}

export default PlayerSearch
