import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, UserCheck, MessageSquare, Swords, Users, Check, X } from 'lucide-react';
import type { Notification } from '../../utils/notificationUtils';
import {
    isFriendRequest,
    extractUsername,
    renderNotificationMessage,
    formatRelativeTime,
} from '../../utils/notificationUtils';
import type { FriendSocketType } from '../../utils/layoutContextUtils';
import styles from './NotificationBell.module.css';

type Props = {
    notification: Notification;
    friendSocket: FriendSocketType;
    onClick: (notification: Notification) => void;
    onDelete: (notificationId: number, e: React.MouseEvent) => void;
    onActionCompleted: (notificationId: number, wasUnread: boolean) => void;
};

const NotificationItem = ({
    notification,
    friendSocket,
    onClick,
    onDelete,
    onActionCompleted,
}: Props) => {
    const { t } = useTranslation();
    const [actionLoading, setActionLoading] = useState(false);
    const [actionFeedback, setActionFeedback] = useState<'accepted' | 'declined' | null>(null);

    const isFriendReq = isFriendRequest(notification);

    const handleAccept = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const username = extractUsername(notification);
        if (!username) return;

        setActionLoading(true);
        try {
            friendSocket.acceptFriendRequest(username);
            setActionFeedback('accepted');
            setTimeout(() => {
                onActionCompleted(notification.id, !notification.is_read);
            }, 1000);
        } catch (err) {
            console.error('Error accepting friend request:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const username = extractUsername(notification);
        if (!username) return;

        setActionLoading(true);
        try {
            friendSocket.rejectFriendRequest(username);
            setActionFeedback('declined');
            setTimeout(() => {
                onActionCompleted(notification.id, !notification.is_read);
            }, 800);
        } catch (err) {
            console.error('Error rejecting friend request:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const getNotificationIcon = () => {
        if (isFriendReq) return <Users size={16} className={styles.iconFriend} aria-hidden="true" />;
        if (notification.message.includes('accepted your friend request')) {
            return <UserCheck size={16} className={styles.iconAccepted} aria-hidden="true" />;
        }
        if (notification.message.includes('message') || notification.link?.startsWith('/chat/')) {
            return <MessageSquare size={16} className={styles.iconMessage} aria-hidden="true" />;
        }
        if (notification.message.includes('challenge') || notification.message.includes('game')) {
            return <Swords size={16} className={styles.iconChallenge} aria-hidden="true" />;
        }
        return <Bell size={16} className={styles.iconDefault} aria-hidden="true" />;
    };

    return (
        <div
            className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
            onClick={() => onClick(notification)}
        >
            <div className={styles.notifIconWrapper}>
                <span className={styles.categoryIcon}>{getNotificationIcon()}</span>
                {!notification.is_read && <span className={styles.unreadDot} />}
            </div>

            <div className={styles.notificationContent}>
                <div className={styles.notificationMessage}>
                    {renderNotificationMessage(notification.message, t)}
                </div>

                {isFriendReq && (
                    <div className={styles.friendActionRow} onClick={(e) => e.stopPropagation()}>
                        {actionFeedback === 'accepted' ? (
                            <span className={styles.actionFeedbackAccepted}>
                                <Check size={14} aria-hidden="true" /> {t('accepted')}
                            </span>
                        ) : actionFeedback === 'declined' ? (
                            <span className={styles.actionFeedbackDeclined}>
                                <X size={14} aria-hidden="true" /> {t('declined')}
                            </span>
                        ) : (
                            <>
                                <button
                                    className={styles.acceptBtn}
                                    onClick={handleAccept}
                                    disabled={actionLoading}
                                >
                                    {t('accept')}
                                </button>
                                <button
                                    className={styles.declineBtn}
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                >
                                    {t('reject')}
                                </button>
                            </>
                        )}
                    </div>
                )}

                <div className={styles.notificationTime}>
                    {formatRelativeTime(notification.created_at, t)}
                </div>
            </div>

            <button
                className={styles.deleteNotification}
                onClick={(e) => onDelete(notification.id, e)}
                title={t('delete')}
                aria-label={t('delete_notification')}
            >
                <X size={14} aria-hidden="true" />
            </button>
        </div>
    );
};

export default NotificationItem;

