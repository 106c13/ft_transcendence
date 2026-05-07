import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './NotificationBell.css'

type Notification = {
	id: number
	message: string
	link: string
	is_read: boolean
	created_at: string
}

function NotificationBell({ userId }: { userId: number }) {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [isOpen, setIsOpen] = useState(false)
	const navigate = useNavigate()

	const fetchUnreadCount = async () => {
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`/api/notifications/unread/${userId}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				setUnreadCount(data.count)
			}
		} catch (error) {
			console.error('Error fetching unread count:', error)
		}
	}

	const fetchNotifications = async () => {
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`/api/notifications/get/${userId}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				setNotifications(data)
				setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
			}
		} catch (error) {
			console.error('Error fetching notifications:', error)
		}
	}

	const markAsRead = async (notificationId: number) => {
		try {
			const token = localStorage.getItem('token')
			await fetch(`/api/notifications/read/${userId}/${notificationId}`, {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
			})
			setNotifications(prev =>
				prev.map(n =>
					n.id === notificationId ? { ...n, is_read: true } : n
				)
			)
			setUnreadCount(prev => Math.max(0, prev - 1))
		} catch (error) {
			console.error('Error marking as read:', error)
		}
	}

	const handleNotificationClick = async (notification: Notification) => {
		if (!notification.is_read) {
			await markAsRead(notification.id)
		}
		setIsOpen(false)
		navigate(notification.link)
	}

	useEffect(() => {
		if (userId) {
			fetchNotifications()
			const interval = setInterval(fetchUnreadCount, 30000)
			return () => clearInterval(interval)
		}
	}, [userId])

	return (
		<div className="notification-bell-container">
			<div className="bell-icon" onClick={() => setIsOpen(!isOpen)}>
				🔔
				{unreadCount > 0 && (
					<span className="notification-badge">{unreadCount}</span>
				)}
			</div>

			{isOpen && (
				<div className="notification-dropdown">
					<div className="notification-header">
						<h3>Notifications</h3>
						{notifications.length > 0 && (
							<button
								className="mark-all-read"
								onClick={() => {
									notifications.forEach(n => {
										if (!n.is_read) markAsRead(n.id)
									})
								}}
							>
								Mark all read
							</button>
						)}
					</div>

					<div className="notification-list">
						{notifications.length === 0 ? (
							<div className="no-notifications">No notifications</div>
						) : (
							notifications.map(notif => (
								<div
									key={notif.id}
									className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
									onClick={() => handleNotificationClick(notif)}
								>
									<div className="notification-message">{notif.message}</div>
									<div className="notification-time">
										{new Date(notif.created_at).toLocaleString()}
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default NotificationBell
