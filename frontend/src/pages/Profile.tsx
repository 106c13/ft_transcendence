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
	const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'friends'>('overview')
	const [friends, setFriends] = useState<User[]>([])

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
			console.log(data.status);

			setFriendStatus(
				data?.status?.toUpperCase() as FriendStatus || 'NONE'
			)
		} catch {
			setFriendStatus('NONE')
		}
	}

	const loadFriends = async () => {
		if (!user) return

		try {
			const token = localStorage.getItem('token')
			if (!token) return

			const res = await fetch(`/api/friends/list/${user.username}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!res.ok) return

			const data = await res.json()
			setFriends(data)
		} catch (err) {
			console.error(err)
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
		if (!user) return

		try {
			const token = localStorage.getItem('token')
			if (!token) return

			const res = await fetch(`/api/friends/request/${user.username}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!res.ok) return

			setFriendStatus('SENT')
		} catch (err) {
			console.error(err)
		}
	}

	const acceptFriendRequest = async () => {
		if (!user) return

		try {
			const token = localStorage.getItem('token')
			if (!token) return

			const res = await fetch(`/api/friends/accept/${user.username}`, {
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

	const rejectFriendRequest = async () => {
		if (!user) return

		try {
			const token = localStorage.getItem('token')
			if (!token) return

			const res = await fetch(`/api/friends/reject/${user.username}`, {
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
		if (!user) return

		try {
			const token = localStorage.getItem('token')
			if (!token) return

			const res = await fetch(`/api/friends/cancel/${user.username}`, {
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
		if (!user) return

		try {
			const token = localStorage.getItem('token')
			if (!token) return

			const res = await fetch(`/api/friends/unfriend/${user.username}`, {
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

				{!isOwnProfile && (
					<div className="header-actions">

						{friendStatus === 'NONE' && (
							<button
								className="add-friend-btn"
								onClick={sendFriendRequest}
							>
								+ Add Friend
							</button>
						)}

						{friendStatus === 'SENT' && (
							<button
								className="pending-btn"
								onClick={cancelFriendRequest}
							>
								Request Sent
							</button>
						)}

						{friendStatus === 'RECEIVED' && (
							<>
								<button
									className="accept-btn"
									onClick={acceptFriendRequest}
								>
									Accept
								</button>

								<button
									className="reject-btn"
									onClick={rejectFriendRequest}
								>
									Reject
								</button>
							</>
						)}

						{friendStatus === 'ACCEPTED' && (
							<button
								className="friends-btn"
								onClick={unFriendRequest}
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
					className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
					onClick={() => setActiveTab('overview')}
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
					className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
					onClick={() => {
						setActiveTab('friends')
						loadFriends()
					}}
				>
					Friends
				</div>

			</div>

			{activeTab === 'overview' && (
				<div className="profile-content">
					Overview content
				</div>
			)}

			{activeTab === 'friends' && (
				<div className="friends-list">
					{friends.length === 0 ? (
						<div className="empty-friends">No friends yet</div>
					) : (
						friends.map(friend => (
							<div
								key={friend.username}
								className="friend-row"
								onClick={() => navigate(`/profile/${friend.username}`)}
							>
								<img
									className="friend-avatar"
									src={
										friend.avatar
											? `/uploads/${friend.avatar}`
											: `/assets/default.jpg`
									}
									alt="avatar"
								/>

								<div className="friend-name">
									{friend.username}
								</div>
							</div>
						))
					)}
				</div>
			)}

		</div>
	)
}

export default Profile
