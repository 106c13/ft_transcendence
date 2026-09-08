import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './MessagesIcon.module.css'

type Props = {
	userId?: number
}

function MessagesIcon({ userId }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [unreadCount, setUnreadCount] = useState(0)

	const fetchUnreadCount = useCallback(async () => {
		if (!userId) return
		const token = localStorage.getItem('token')
		if (!token) return

		try {
			const res = await fetch('/api/messages/unread/total', {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				setUnreadCount(data.count ?? 0)
			}
		} catch (err) {
			console.error('Error fetching unread messages count:', err)
		}
	}, [userId])

	useEffect(() => {
		if (!userId) return

		fetchUnreadCount()
		const interval = setInterval(fetchUnreadCount, 3000)

		const handleMessagesRead = () => {
			fetchUnreadCount()
		}

		window.addEventListener('messages_read', handleMessagesRead)
		window.addEventListener('focus', handleMessagesRead)
		document.addEventListener('visibilitychange', handleMessagesRead)

		return () => {
			clearInterval(interval)
			window.removeEventListener('messages_read', handleMessagesRead)
			window.removeEventListener('focus', handleMessagesRead)
			document.removeEventListener('visibilitychange', handleMessagesRead)
		}
	}, [userId, fetchUnreadCount])

	return (
		<div
			className={styles.messagesActionItem}
			onClick={() => navigate('/chat')}
			title={t('chat', 'Chat')}
			role="button"
			tabIndex={0}
			aria-label={t('chat', 'Chat')}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					navigate('/chat')
				}
			}}
		>
			<span className={styles.messagesIcon}>✉️</span>
			{unreadCount > 0 && (
				<span className={styles.notificationBadge}>
					{unreadCount > 99 ? '99+' : unreadCount}
				</span>
			)}
		</div>
	)
}

export default MessagesIcon
