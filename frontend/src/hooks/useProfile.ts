import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TabType, User, FriendStatus } from '../constants/profileConstants'

export function useProfile(username?: string) {
	const [user, setUser] = useState<User | null>(null)
	const [error] = useState('')
	const [menuOpen, setMenuOpen] = useState(false)
	const [friendStatus, setFriendStatus] = useState<FriendStatus>('NONE')
	const [activeTab, setActiveTab] = useState<TabType>('overview')
	const [friends, setFriends] = useState<User[]>([])
	const isLoggedIn = !!localStorage.getItem('token')

	const navigate = useNavigate()

	const loadFriendStatus = async (token: string, targetUsername: string) => {
		try {
			const res = await fetch(`/api/friends/status/${targetUsername}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (!res.ok) return
			const data = await res.json()
			setFriendStatus((data?.status?.toUpperCase() as FriendStatus) || 'NONE')
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
				headers: { Authorization: `Bearer ${token}` },
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
			const endpoint = username ? `/api/users/${username}` : '/api/users/me'
			const headers: HeadersInit = {}

			if (token) {
				headers.Authorization = `Bearer ${token}`
			}

			const res = await fetch(endpoint, { headers })

			if (res.status === 404) {
				setUser(null)
				return
			}

			if (!res.ok) {
				localStorage.removeItem('token')
				navigate('/login')
				return
			}

			const data = await res.json()
			setUser({
				...data,
				isOwnProfile: data.isOwnProfile ?? false,
			})

			if (token && username && data.isOwnProfile === false) {
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

	const handleSelectTab = (tab: TabType) => {
		setActiveTab(tab)
		if (tab === 'friends') {
			loadFriends()
		}
	}

	const sendFriendRequest = async () => {
		if (!user) return
		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/request/${user.username}`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
		})
		if (res.ok) setFriendStatus('SENT')
	}

	const acceptFriendRequest = async () => {
		if (!user) return
		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/accept/${user.username}`, {
			method: 'PATCH',
			headers: { Authorization: `Bearer ${token}` },
		})
		if (res.ok) setFriendStatus('ACCEPTED')
	}

	const rejectFriendRequest = async () => {
		if (!user) return
		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/reject/${user.username}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` },
		})
		if (res.ok) setFriendStatus('NONE')
	}

	const cancelFriendRequest = async () => {
		if (!user) return
		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/cancel/${user.username}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` },
		})
		if (res.ok) setFriendStatus('NONE')
	}

	const unFriendRequest = async () => {
		if (!user) return
		const token = localStorage.getItem('token')
		if (!token) return

		const res = await fetch(`/api/friends/unfriend/${user.username}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` },
		})
		if (res.ok) setFriendStatus('NONE')
	}

	const logout = () => {
		localStorage.removeItem('token')
		navigate('/login')
	}

	const goToSettings = () => navigate('/profile/settings')
	const goToUserProfile = (targetUsername: string) => navigate(`/profile/${targetUsername}`)

	return {
		user,
		error,
		friends,
		friendStatus,
		activeTab,
		isLoggedIn,
		menuOpen,
		setMenuOpen,
		handleSelectTab,
		sendFriendRequest,
		acceptFriendRequest,
		rejectFriendRequest,
		cancelFriendRequest,
		unFriendRequest,
		logout,
		goToSettings,
		goToUserProfile,
	}
}
