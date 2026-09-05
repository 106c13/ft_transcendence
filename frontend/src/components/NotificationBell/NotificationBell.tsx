import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './NotificationBell.module.css'

type Notification = {
    id: number
    message: string
    link: string
    is_read: boolean
    created_at: string
}

function NotificationBell({ userId }: { userId: number }) {
    const { t } = useTranslation()
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

    const deleteNotification = async (notificationId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/notifications/delete/${userId}/${notificationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            
            if (res.ok) {
                const deleted = notifications.find(n => n.id === notificationId)
                setNotifications(prev => prev.filter(n => n.id !== notificationId))
                if (deleted && !deleted.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id)
        }
        setIsOpen(false)
        if (notification.link) {
            navigate(notification.link)
        }
    }

    useEffect(() => {
        if (userId) {
            fetchNotifications()
            const interval = setInterval(fetchUnreadCount, 3000)
            return () => clearInterval(interval)
        }
    }, [userId])

    return (
        <div className={styles.notificationBellContainer}>
            <div className={styles.bellIcon} onClick={() => setIsOpen(!isOpen)}>
                🔔
                {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>{unreadCount}</span>
                )}
            </div>

            {isOpen && (
                <div className={styles.notificationDropdown}>
                    <div className={styles.notificationHeader}>
                        <h3>{t('notifications')}</h3>
                        {notifications.length > 0 && (
                            <button
                                className={styles.markAllRead}
                                onClick={() => {
                                    notifications.forEach(n => {
                                        if (!n.is_read) markAsRead(n.id)
                                    })
                                }}
                            >
                                {t('mark_all_read')}
                            </button>
                        )}
                    </div>

                    <div className={styles.notificationList}>
                        {notifications.length === 0 ? (
                            <div className={styles.noNotifications}>{t('no_notifications')}</div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`${styles.notificationItem} ${!notif.is_read ? styles.unread : ''}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className={styles.notificationContent}>
                                        <div className={styles.notificationMessage}>{notif.message}</div>
                                        <div className={styles.notificationTime}>
                                            {new Date(notif.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        className={styles.deleteNotification}
                                        onClick={(e) => deleteNotification(notif.id, e)}
                                    >
                                        ✕
                                    </button>
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