import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

type User = {
	username: string
	email: string
	avatar?: string
	bio?: string
}

function Profile() {
	const [user, setUser] = useState<User | null>(null)
	const [error, setError] = useState('')
	const [menuOpen, setMenuOpen] = useState(false)
	const navigate = useNavigate()

	const loadProfile = async () => {
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

			if (res.status === 401) {
				localStorage.removeItem('token')
				navigate('/login')
				return
			}

			if (!res.ok) {
				setError('Failed to load profile')
				return
			}

			const data = await res.json()
			setUser(data)
		} catch {
			localStorage.removeItem('token')
			navigate('/login')
		}
	}

	useEffect(() => {
		loadProfile()
	}, [])

	const logout = () => {
		localStorage.removeItem('token')
		navigate('/login')
	}

	if (error) {
		return (
			<div className="auth-page">
				<p className="msg error">{error}</p>
			</div>
		)
	}

	if (!user) {
		return (
			<div className="auth-page">
				<p className="msg">Loading...</p>
			</div>
		)
	}

	return (
		<div className="profile-page">

			<div className="profile-header">

				{/* MENU */}
				<div className="profile-actions">
					<div
						className="menu-btn"
						onClick={() => setMenuOpen(!menuOpen)}
					>
						⋯
					</div>

					<div className={`menu-dropdown ${menuOpen ? 'open' : ''}`}>
						<div onClick={() => navigate('/profile/settings')}>
							⚙️ Settings
						</div>

						<div onClick={logout} className="danger">
							🚪 Logout
						</div>
					</div>
				</div>

				{/* AVATAR */}
				<img
					className="profile-avatar"
					src={
						user.avatar
							? `/uploads/${user.avatar}`
							: `/assets/default.jpg`
					}
					alt="avatar"
				/>

				{/* INFO */}
				<div className="profile-info">

					<div className="top-row">
						<div className="username">{user.username}</div>
						<div className="flag">🏳️</div>
					</div>

					<div className="bio">
						{user.bio || 'No bio yet'}
					</div>

					<div className="meta">
						<span>Joined: 2026-01-01</span>
						<span>• Friends: 0</span>
						<span>• Online</span>
					</div>

				</div>

			</div>

			{/* TABS */}
			<div className="profile-tabs">

				<div
					className="tab active"
					onClick={() => navigate(`/profile/${user.username}`)}
				>
					Overview
				</div>

				<div
					className="tab"
					onClick={() => navigate(`/profile/${user.username}/games`)}
				>
					Games
				</div>

				<div
					className="tab"
					onClick={() => navigate(`/profile/${user.username}/friends`)}
				>
					Friends
				</div>

			</div>

		</div>
	)
}

export default Profile
