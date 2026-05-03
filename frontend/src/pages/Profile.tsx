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

		} catch (err) {
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
		<div className="auth-page">
			<div className="profile-card">
				<img
					className="avatar"
					src={user.avatar ? `/uploads/${user.avatar}` : `/assets/default.jpg`}
					alt="avatar"
				/>

				<div className="info">
					<div className="username">{user.username}</div>
					<div className="email">{user.email}</div>

					<div className="bio">
						<p>Bio</p>
						{user.bio} 
					</div>	

					<button
						className="settings-btn"
						onClick={() => navigate('/profile/settings')}
					>
						⚙️ Settings
					</button>

					<button className="logout-btn" onClick={logout}>
						Logout
					</button>
				</div>
			</div>
		</div>
	)
}

export default Profile
