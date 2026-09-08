import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './NotificationBell.module.css'

export type Notification = {
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
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})
    const [actionFeedback, setActionFeedback] = useState<Record<number, string>>({})

    const containerRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const location = useLocation()

    const isChatNotification = (n: Notification) =>
        n.link?.startsWith('/chat') ||
        n.message.includes('sent you a message') ||
        n.message.includes('started a new conversation')

    // Fetch full notification list
    const fetchNotifications = useCallback(async (showLoading = false) => {
        if (!userId) return
        const token = localStorage.getItem('token')
        if (!token) return

        if (showLoading) setLoading(true)
        try {
            const res = await fetch(`/api/notifications/get/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data: Notification[] = await res.json()
                const nonChat = data.filter((n) => !isChatNotification(n))
                setNotifications(nonChat)
                setUnreadCount(nonChat.filter((n) => !n.is_read).length)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [userId])

    // Fetch unread count, and if count changed, refresh full notification list
    const fetchUnreadCount = useCallback(async () => {
        if (!userId) return
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch(`/api/notifications/unread/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setUnreadCount((prevCount) => {
                    if (data.count !== prevCount) {
                        // Count changed: fetch latest notifications immediately
                        fetchNotifications(false)
                    }
                    return data.count
                })
            }
        } catch (error) {
            console.error('Error fetching unread count:', error)
        }
    }, [userId, fetchNotifications])

    // Initial fetch on mount
    useEffect(() => {
        if (userId) {
            fetchNotifications(true)
            fetchUnreadCount()
        }
    }, [userId, fetchNotifications, fetchUnreadCount])

    // Polling interval:
    // If dropdown is open -> fetch full notifications list every 3s so live updates show in real-time
    // If dropdown is closed -> poll unread count every 3s
    useEffect(() => {
        if (!userId) return

        const interval = setInterval(() => {
            if (isOpen) {
                fetchNotifications(false)
            } else {
                fetchUnreadCount()
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [userId, isOpen, fetchNotifications, fetchUnreadCount])

    // Fetch immediately when opening dropdown
    const toggleDropdown = () => {
        setIsOpen((prev) => {
            const next = !prev
            if (next) {
                fetchNotifications(false)
            }
            return next
        })
    }

    // Refresh when user focuses or returns to tab
    useEffect(() => {
        const handleFocus = () => {
            if (userId) {
                fetchUnreadCount()
                if (isOpen) {
                    fetchNotifications(false)
                }
            }
        }

        window.addEventListener('focus', handleFocus)
        document.addEventListener('visibilitychange', handleFocus)
        return () => {
            window.removeEventListener('focus', handleFocus)
            document.removeEventListener('visibilitychange', handleFocus)
        }
    }, [userId, isOpen, fetchUnreadCount, fetchNotifications])

    // Close dropdown on route change
    useEffect(() => {
        setIsOpen(false)
    }, [location.pathname])

    // Click outside and Escape key to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    // Mark single notification as read
    const markAsRead = async (notificationId: number) => {
        const target = notifications.find((n) => n.id === notificationId)
        if (!target || target.is_read) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/notifications/read/${userId}/${notificationId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
                )
                setUnreadCount((prev) => Math.max(0, prev - 1))
            } else if (res.status === 404) {
                // Item deleted on server; remove from local state
                setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
                setUnreadCount((prev) => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    // Mark all notifications as read
    const markAllRead = async () => {
        if (unreadCount === 0) return
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/notifications/read-all/${userId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    // Clear all notifications
    const clearAll = async () => {
        if (notifications.length === 0) return
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/notifications/clear-all/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                setNotifications([])
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Error clearing notifications:', error)
        }
    }

    // Delete single notification
    const deleteNotification = async (notificationId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/notifications/delete/${userId}/${notificationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok || res.status === 404) {
                const deleted = notifications.find((n) => n.id === notificationId)
                setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
                if (deleted && !deleted.is_read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    // Helper to check if a notification is a friend request
    const isFriendRequest = (notif: Notification) => {
        return notif.message.includes('sent you a friend request')
    }

    // Helper to extract username from friend request notification
    const extractUsername = (notif: Notification): string | null => {
        if (notif.link && notif.link.startsWith('/profile/')) {
            const parts = notif.link.replace('/profile/', '').split('/')
            if (parts[0]) return parts[0]
        }
        const match = notif.message.match(/^(.+?)\s+sent you a friend request/)
        return match ? match[1] : null
    }

    // Quick Accept friend request
    const handleAcceptFriend = async (notif: Notification, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        const username = extractUsername(notif)
        if (!username) return

        const token = localStorage.getItem('token')
        if (!token) return

        setActionLoading((prev) => ({ ...prev, [notif.id]: true }))
        try {
            const res = await fetch(`/api/friends/accept/${username}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                setActionFeedback((prev) => ({ ...prev, [notif.id]: 'accepted' }))
                if (!notif.is_read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1))
                }
                setTimeout(() => {
                    setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
                    setActionFeedback((prev) => {
                        const copy = { ...prev }
                        delete copy[notif.id]
                        return copy
                    })
                }, 1000)
            }
        } catch (err) {
            console.error('Error accepting friend request:', err)
        } finally {
            setActionLoading((prev) => ({ ...prev, [notif.id]: false }))
        }
    }

    // Quick Decline friend request
    const handleRejectFriend = async (notif: Notification, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        const username = extractUsername(notif)
        if (!username) return

        const token = localStorage.getItem('token')
        if (!token) return

        setActionLoading((prev) => ({ ...prev, [notif.id]: true }))
        try {
            const res = await fetch(`/api/friends/reject/${username}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                setActionFeedback((prev) => ({ ...prev, [notif.id]: 'declined' }))
                if (!notif.is_read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1))
                }
                setTimeout(() => {
                    setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
                    setActionFeedback((prev) => {
                        const copy = { ...prev }
                        delete copy[notif.id]
                        return copy
                    })
                }, 800)
            }
        } catch (err) {
            console.error('Error rejecting friend request:', err)
        } finally {
            setActionLoading((prev) => ({ ...prev, [notif.id]: false }))
        }
    }

    // Notification click navigation
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id)
        }
        setIsOpen(false)
        if (notification.link) {
            navigate(notification.link)
        }
    }

    // Relative / friendly timestamp formatting
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return ''

        const now = new Date()
        const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffSecs < 60) return 'Just now'
        const diffMins = Math.floor(diffSecs / 60)
        if (diffMins < 60) return `${diffMins}m ago`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h ago`
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays}d ago`

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    // Category icon
    const getNotificationIcon = (notif: Notification) => {
        if (isFriendRequest(notif)) return '👥'
        if (notif.message.includes('accepted your friend request')) return '🤝'
        if (notif.message.includes('message') || notif.link?.startsWith('/chat/')) return '💬'
        if (notif.message.includes('challenge') || notif.message.includes('game')) return '🏓'
        return '🔔'
    }

    const displayedNotifications =
        filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

    return (
        <div className={styles.notificationBellContainer} ref={containerRef}>
            <div
                className={`${styles.bellIcon} ${isOpen ? styles.active : ''}`}
                onClick={toggleDropdown}
                role="button"
                tabIndex={0}
                aria-label={t('notifications', 'Notifications')}
                aria-expanded={isOpen}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleDropdown()
                    }
                }}
            >
                <span className={styles.bellSymbol}>🔔</span>
                {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </div>

            {isOpen && (
                <div className={styles.notificationDropdown}>
                    {/* Header */}
                    <div className={styles.notificationHeader}>
                        <div className={styles.headerTitleGroup}>
                            <h3>{t('notifications', 'Notifications')}</h3>
                            {unreadCount > 0 && (
                                <span className={styles.headerUnreadBadge}>
                                    {unreadCount} {t('unread', 'Unread')}
                                </span>
                            )}
                        </div>

                        <div className={styles.headerActions}>
                            {unreadCount > 0 && (
                                <button
                                    className={styles.actionTextBtn}
                                    onClick={markAllRead}
                                    title={t('mark_all_read', 'Mark all read')}
                                >
                                    {t('mark_all_read', 'Mark all read')}
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    className={`${styles.actionTextBtn} ${styles.clearBtn}`}
                                    onClick={clearAll}
                                    title={t('clear_all', 'Clear all')}
                                >
                                    {t('clear_all', 'Clear all')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    {notifications.length > 0 && (
                        <div className={styles.filterTabs}>
                            <button
                                className={`${styles.filterTab} ${filter === 'all' ? styles.activeTab : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                {t('all', 'All')} ({notifications.length})
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === 'unread' ? styles.activeTab : ''}`}
                                onClick={() => setFilter('unread')}
                            >
                                {t('unread', 'Unread')} ({unreadCount})
                            </button>
                        </div>
                    )}

                    {/* List */}
                    <div className={styles.notificationList}>
                        {loading && notifications.length === 0 ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner} />
                            </div>
                        ) : displayedNotifications.length === 0 ? (
                            <div className={styles.noNotifications}>
                                <span className={styles.emptyIcon}>🔕</span>
                                <p>{t('no_notifications', 'No notifications')}</p>
                            </div>
                        ) : (
                            displayedNotifications.map((notif) => {
                                const isFriendReq = isFriendRequest(notif)
                                const feedback = actionFeedback[notif.id]
                                const isActionBusy = actionLoading[notif.id]

                                return (
                                    <div
                                        key={notif.id}
                                        className={`${styles.notificationItem} ${!notif.is_read ? styles.unread : ''}`}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className={styles.notifIconWrapper}>
                                            <span className={styles.categoryIcon}>
                                                {getNotificationIcon(notif)}
                                            </span>
                                            {!notif.is_read && (
                                                <span className={styles.unreadDot} />
                                            )}
                                        </div>

                                        <div className={styles.notificationContent}>
                                            <div className={styles.notificationMessage}>
                                                {notif.message}
                                            </div>

                                            {/* Friend Request Quick Actions */}
                                            {isFriendReq && (
                                                <div
                                                    className={styles.friendActionRow}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {feedback === 'accepted' ? (
                                                        <span className={styles.actionFeedbackAccepted}>
                                                            ✓ {t('accepted', 'Accepted')}
                                                        </span>
                                                    ) : feedback === 'declined' ? (
                                                        <span className={styles.actionFeedbackDeclined}>
                                                            ✕ {t('declined', 'Declined')}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className={styles.acceptBtn}
                                                                onClick={(e) =>
                                                                    handleAcceptFriend(notif, e)
                                                                }
                                                                disabled={isActionBusy}
                                                            >
                                                                {t('accept', 'Accept')}
                                                            </button>
                                                            <button
                                                                className={styles.declineBtn}
                                                                onClick={(e) =>
                                                                    handleRejectFriend(notif, e)
                                                                }
                                                                disabled={isActionBusy}
                                                            >
                                                                {t('reject', 'Reject')}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            <div className={styles.notificationTime}>
                                                {formatTime(notif.created_at)}
                                            </div>
                                        </div>

                                        <button
                                            className={styles.deleteNotification}
                                            onClick={(e) => deleteNotification(notif.id, e)}
                                            title="Delete"
                                            aria-label="Delete notification"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell