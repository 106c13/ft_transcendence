import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff } from 'lucide-react';
import NavTooltip from '../NavTooltip/NavTooltip';
import type { FriendSocketType } from '../../utils/layoutContextUtils';
import type { Notification } from '../../utils/notificationUtils';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import styles from './NotificationBell.module.css';

type Props = {
    userId: number;
    friendSocket: FriendSocketType;
};

const NotificationBell = ({ userId, friendSocket }: Props) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllRead,
        clearAll,
        deleteNotification,
        removeNotificationLocally,
    } = useNotifications(userId);

    const toggleDropdown = () => {
        setIsOpen((prev) => {
            const next = !prev;
            if (next) {
                fetchNotifications(false);
            }
            return next;
        });
    };

    // Close dropdown on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Click outside and Escape key to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleDeleteNotification = (notificationId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        deleteNotification(notificationId);
    };

    const displayedNotifications =
        filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

    return (
        <div className={styles.notificationBellContainer} ref={containerRef}>
            <NavTooltip content={t('notifications')} position="bottom" disabled={isOpen} offset="navbar">
                <div
                    className={`${styles.bellIcon} ${isOpen ? styles.active : ''}`}
                    onClick={toggleDropdown}
                    role="button"
                    tabIndex={0}
                    aria-label={t('notifications')}
                    aria-expanded={isOpen}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown();
                        }
                    }}
                >
                    <span className={styles.bellIconBox}>
                        <Bell size={20} className={styles.bellSymbol} aria-hidden="true" />
                    </span>
                    <span className={styles.navLabel}>{t('notifications')}</span>
                    {unreadCount > 0 && (
                        <span className={styles.notificationBadge}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
            </NavTooltip>

            {isOpen && (
                <div className={styles.notificationDropdown}>
                    <div className={styles.notificationHeader}>
                        <div className={styles.headerTitleGroup}>
                            <h3>{t('notifications')}</h3>
                            {unreadCount > 0 && (
                                <span className={styles.headerUnreadBadge}>
                                    {unreadCount} {t('unread')}
                                </span>
                            )}
                        </div>

                        <div className={styles.headerActions}>
                            {unreadCount > 0 && (
                                <button
                                    className={styles.actionTextBtn}
                                    onClick={markAllRead}
                                    title={t('mark_all_read')}
                                >
                                    {t('mark_all_read')}
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    className={`${styles.actionTextBtn} ${styles.clearBtn}`}
                                    onClick={clearAll}
                                    title={t('clear_all')}
                                >
                                    {t('clear_all')}
                                </button>
                            )}
                        </div>
                    </div>

                    {notifications.length > 0 && (
                        <div className={styles.filterTabs}>
                            <button
                                className={`${styles.filterTab} ${filter === 'all' ? styles.activeTab : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                {t('all')} ({notifications.length})
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === 'unread' ? styles.activeTab : ''}`}
                                onClick={() => setFilter('unread')}
                            >
                                {t('unread')} ({unreadCount})
                            </button>
                        </div>
                    )}

                    <div className={styles.notificationList}>
                        {loading && notifications.length === 0 ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner} />
                            </div>
                        ) : displayedNotifications.length === 0 ? (
                            <div className={styles.noNotifications}>
                                <BellOff size={32} className={styles.emptyIcon} aria-hidden="true" />
                                <p>{t('no_notifications')}</p>
                            </div>
                        ) : (
                            displayedNotifications.map((notif) => (
                                <NotificationItem
                                    key={notif.id}
                                    notification={notif}
                                    friendSocket={friendSocket}
                                    onClick={handleNotificationClick}
                                    onDelete={handleDeleteNotification}
                                    onActionCompleted={removeNotificationLocally}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
