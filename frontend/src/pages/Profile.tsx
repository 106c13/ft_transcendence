import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Profile.css'
import ProfileHeader from '../components/profile/ProfileHeader'
import FriendsList from '../components/profile/FriendsList'

export type User = {
	username: string
	email: string
	avatar?: string
	bio?: string
	created_at?: string
}

export type FriendStatus =
	| 'NONE'
	| 'PENDING'
	| 'ACCEPTED'
	| 'RECEIVED'
	| 'SENT'

function Profile() {
	const [user, setUser] = useState<User | null>(null)
	const [error] = useState('')
	const [menuOpen, setMenuOpen] = useState(false)
	const [friendStatus, setFriendStatus] = useState<FriendStatus>('NONE')
	const [activeTab, setActiveTab] =
		useState<'overview' | 'games' | 'friends'>('overview')
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

			setFriendStatus(
				(data?.status?.toUpperCase() as FriendStatus) || 'NONE',
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

		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/request/${user.username}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (res.ok) setFriendStatus('SENT')
	}

	const acceptFriendRequest = async () => {
		if (!user) return

		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/accept/${user.username}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (res.ok) setFriendStatus('ACCEPTED')
	}

	const rejectFriendRequest = async () => {
		if (!user) return

		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/reject/${user.username}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (res.ok) setFriendStatus('NONE')
	}

	const cancelFriendRequest = async () => {
		if (!user) return

		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/cancel/${user.username}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (res.ok) setFriendStatus('NONE')
	}

	const unFriendRequest = async () => {
		if (!user) return

		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/unfriend/${user.username}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (res.ok) setFriendStatus('NONE')
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
			<ProfileHeader
				user={user}
				isOwnProfile={isOwnProfile}
				menuOpen={menuOpen}
				setMenuOpen={setMenuOpen}
				friendStatus={friendStatus}
				onSend={sendFriendRequest}
				onAccept={acceptFriendRequest}
				onReject={rejectFriendRequest}
				onCancel={cancelFriendRequest}
				onUnfriend={unFriendRequest}
				onLogout={logout}
				onSettings={() => navigate('/profile/settings')}
			/>

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
				<div className="profile-content">Overview content</div>
			)}

			{activeTab === 'friends' && (
				<FriendsList
					friends={friends}
					onOpenProfile={(username: string) =>
						navigate(`/profile/${username}`)
					}
				/>
			)}
		</div>
	)
}

export default Profile
