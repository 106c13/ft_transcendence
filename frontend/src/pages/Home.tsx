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

	return (
		<div className="home-container">
			<LeftSidebar />
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
