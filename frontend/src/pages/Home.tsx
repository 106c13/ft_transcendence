import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Home.css'
import LeftSidebar from '../components/LeftSidebar'
import RightSidebar from '../components/RightSidebar'

type User = {
	id: number
	username: string
	email: string
	avatar?: string
	bio?: string
	status?: 'ONLINE' | 'OFFLINE' | 'INGAME'
}

function Home() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<User[]>([])
	const [showResults, setShowResults] = useState(false)
	const [isSearching, setIsSearching] = useState(false)
	const [currentUser, setCurrentUser] = useState<User | null>(null)

	useEffect(() => {
		const loadCurrentUser = async () => {
			const token = localStorage.getItem('token')
			if (!token) {
				navigate('/login')
				return
			}

			try {
				const res = await fetch('/api/users/me', {
					headers: { Authorization: `Bearer ${token}` },
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
	}, [navigate])

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
		<div className="home-container">
			<LeftSidebar
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				searchResults={searchResults}
				showResults={showResults}
				isSearching={isSearching}
				onUserClick={handleUserClick}
				getStatusDot={getStatusDot}
			/>

			<RightSidebar currentUser={currentUser} />

			<main className="main-content">
				<div className="content-header">
					<h1>{t('welcome', { username: currentUser?.username || 'Player' })}</h1>
				</div>
			</main>
		</div>
	)
}

export default Home
