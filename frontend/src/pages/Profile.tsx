import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Profile.css'

type User = {
	username: string
	email: string
	avatar?: string
	bio?: string
	created_at?: string
}

type FriendStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'RECEIVED' | 'SENT'

function Profile() {
	const [user, setUser] = useState<User | null>(null)
	const [error] = useState('')
	const [menuOpen, setMenuOpen] = useState(false)
	const [friendStatus, setFriendStatus] = useState<FriendStatus>('NONE')

	const navigate = useNavigate()
	const { username } = useParams()

	const isOwnProfile = !username || username === 'me'

	const loadFriendStatus = async (token: string, username: string) => {
		try {
			const res = await fetch(`/api/friends/status/${username}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!res.ok) return

			const data = await res.json()

			setFriendStatus(
				data?.status?.toUpperCase() as FriendStatus || 'NONE'
			)
		} catch {
			setFriendStatus('NONE')
		}
	}

	const loadProfile = async () => {
		try {
			const token = localStorage.getItem('token')

			const endpoint = username
				? `/api/users/${username}`
				: '/api/users/me'

			const headers: HeadersInit = {}

			if (token) {
				headers.Authorization = `Bearer ${token}`
			}

			const res = await fetch(endpoint, { headers })

			if (res.status === 404) {
				setUser(null)
				return
			}

			if (!username && res.status === 401) {
				localStorage.removeItem('token')
				navigate('/login')
				return
			}

			if (!res.ok) {
				localStorage.removeItem('token')
				navigate('/login')
				return
			}

			const data = await res.json()
			setUser(data)

			// load friend status only for other users
			if (username && token && !isOwnProfile) {
				loadFriendStatus(token, username)
			}

		} catch {
			localStorage.removeItem('token')
			navigate('/login')
		}
	}

	useEffect(() => {
		loadProfile()
	}, [username])

	const sendFriendRequest = async () => {
		try {
			const token = localStorage.getItem('token')

			const res = await fetch(`/api/friends/request/${user?.username}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!res.ok) return

			setFriendStatus('PENDING')
		} catch (err) {
			console.error(err)
		}
	}

	const acceptFriendRequest = async (username: string) => {
		try {
			const token = localStorage.getItem('token')

			const res = await fetch(`/api/friends/accept/${username}`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!res.ok) return

			setFriendStatus('ACCEPTED')
		} catch (err) {
			console.error(err)
		}
	}

	const rejectFriendRequest = async (username: string) => {
		try {
			const token = localStorage.getItem('token')

			const res = await fetch(`/api/friends/reject/${username}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!res.ok) return

			setFriendStatus('NONE')
		} catch (err) {
			console.error(err)
		}
	}

	const cancelFriendRequest = async () => {
		try {
			const token = localStorage.getItem('token')

			const res = await fetch(`/api/friends/cancel/${user?.username}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!res.ok) return

			setFriendStatus('NONE')
		} catch (err) {
			console.error(err)
		}
	}

	const unFriendRequest = async () => {
		try {
			const token = localStorage.getItem('token')

			const res = await fetch(`/api/friends/unfriend/${user?.username}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!res.ok) return

			setFriendStatus('NONE')
		} catch (err) {
			console.error(err)
		}
	}

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
				<p className="msg">User not found</p>
			</div>
		)
	}

	return (
		<div className="profile-page">

			<div className="profile-header">

				{isOwnProfile && (
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
				)}

				<img
					className="profile-avatar"
					src={
						user.avatar
							? `/uploads/${user.avatar}`
							: `/assets/default.jpg`
					}
					alt="avatar"
				/>

				<div className="profile-info">

					<div className="top-row">
						<div className="username">{user.username}</div>
						<div className="flag">🏳️</div>
					</div>

					<div className="bio">
						{user.bio || 'No bio yet'}
					</div>

					<div className="meta">
						<span>
							Joined:{' '}
							{user.created_at
								? new Date(user.created_at).toLocaleDateString()
								: 'unknown'}
						</span>
						<span>• Friends: 0</span>
						<span>• Online</span>
					</div>

				</div>

				{/* RIGHT SIDE BUTTON */}
				{!isOwnProfile && (
					<div className="header-actions">

						{friendStatus === 'NONE' && (
							<button onClick={sendFriendRequest}>
								+ Add Friend
							</button>
						)}

						{friendStatus === 'SENT' && (
							<button onClick={cancelFriendRequest}>
								Request Sent
							</button>
						)}

						{friendStatus === 'RECEIVED' && (
							<>
								<button
									onClick={() => acceptFriendRequest(user!.username)}
								>
									Accept
								</button>

								<button
									onClick={() => rejectFriendRequest(user!.username)}
								>
									Reject
								</button>
							</>
						)}

						{friendStatus === 'ACCEPTED' && (
							<button
								onClick={() => unFriendRequest()}
							>
								Friends ✓
							</button>
						)}
					</div>
				)}

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
