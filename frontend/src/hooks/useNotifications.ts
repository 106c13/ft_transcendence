import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../utils/notificationUtils';
import { isChatNotification } from '../utils/notificationUtils';

export function useNotifications(userId: number | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async (showLoading = false) => {
        if (!userId) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        if (showLoading) setLoading(true);
        try {
            const res = await fetch(`/api/notifications/get/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: Notification[] = await res.json();
                const nonChat = data.filter((n) => !isChatNotification(n));
                setNotifications(nonChat);
                setUnreadCount(nonChat.filter((n) => !n.is_read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [userId]);

    // Initial load on mount or user change
    useEffect(() => {
        if (!userId) return;
        fetchNotifications(true);
    }, [userId, fetchNotifications]);

    // WebSocket real-time updates via window events
    useEffect(() => {
        const handleNewNotification = (e: Event) => {
            const customEvent = e as CustomEvent<Notification>;
            const newNotif = customEvent.detail;
            if (!newNotif || isChatNotification(newNotif)) return;

            setNotifications((prev) => {
                const exists = prev.some((n) => n.id === newNotif.id);
                if (exists) return prev;
                return [newNotif, ...prev];
            });
            if (!newNotif.is_read) {
                setUnreadCount((prev) => prev + 1);
            }
        };

        const handleNotificationDeleted = (e: Event) => {
            const customEvent = e as CustomEvent<{ link?: string; id?: number }>;
            const detail = customEvent.detail;
            if (!detail) return;

            setNotifications((prev) => {
                const target = prev.find((n) =>
                    (detail.id && n.id === detail.id) ||
                    (detail.link && n.link === detail.link)
                );
                if (target && !target.is_read) {
                    setUnreadCount((count) => Math.max(0, count - 1));
                }
                return prev.filter((n) =>
                    !(detail.id && n.id === detail.id) &&
                    !(detail.link && n.link === detail.link)
                );
            });
        };

        window.addEventListener('new_notification', handleNewNotification);
        window.addEventListener('notification_deleted', handleNotificationDeleted);

        return () => {
            window.removeEventListener('new_notification', handleNewNotification);
            window.removeEventListener('notification_deleted', handleNotificationDeleted);
        };
    }, []);

    const markAsRead = useCallback(async (notificationId: number) => {
        if (!userId) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/notifications/read/${userId}/${notificationId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok || res.status === 404) {
                setNotifications((prev) => {
                    const target = prev.find((n) => n.id === notificationId);
                    if (target && !target.is_read) {
                        setUnreadCount((count) => Math.max(0, count - 1));
                    }
                    return prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n));
                });
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }, [userId]);

    const markAllRead = useCallback(async () => {
        if (unreadCount === 0 || !userId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/notifications/read-all/${userId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }, [userId, unreadCount]);

    const clearAll = useCallback(async () => {
        if (notifications.length === 0 || !userId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/notifications/clear-all/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }, [userId, notifications.length]);

    const deleteNotification = useCallback(async (notificationId: number) => {
        if (!userId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/notifications/delete/${userId}/${notificationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok || res.status === 404) {
                setNotifications((prev) => {
                    const deleted = prev.find((n) => n.id === notificationId);
                    if (deleted && !deleted.is_read) {
                        setUnreadCount((count) => Math.max(0, count - 1));
                    }
                    return prev.filter((n) => n.id !== notificationId);
                });
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }, [userId]);

    const removeNotificationLocally = useCallback((notificationId: number, wasUnread: boolean) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (wasUnread) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllRead,
        clearAll,
        deleteNotification,
        removeNotificationLocally,
    };
}
