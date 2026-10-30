import type { TFunction } from 'i18next';

export type Notification = {
    id: number;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
};

export const isChatNotification = (notif: Notification): boolean => {
    return (
        notif.link?.startsWith('/chat') ||
        notif.message.includes('sent you a message') ||
        notif.message.includes('started a new conversation')
    );
};

export const isFriendRequest = (notif: Notification): boolean => {
    if (notif.message.includes('sent you a friend request') || notif.message.includes('notification_friend_request')) {
        return true;
    }
    if (notif.message.startsWith('{')) {
        try {
            const parsed = JSON.parse(notif.message);
            return parsed.key === 'notification_friend_request';
        } catch {
            // Ignore parse errors for plain text
        }
    }
    return false;
};

export const extractUsername = (notif: Notification): string | null => {
    if (notif.link && notif.link.startsWith('/profile/')) {
        const parts = notif.link.replace('/profile/', '').split('/');
        if (parts[0]) return parts[0];
    }
    if (notif.message.startsWith('{')) {
        try {
            const parsed = JSON.parse(notif.message);
            if (parsed.username) return parsed.username;
        } catch {
            // Ignore parse errors for plain text
        }
    }
    const match = notif.message.match(/^(.+?)\s+sent you a friend request/);
    return match ? match[1] : null;
};

export const renderNotificationMessage = (msg: string, t: TFunction): string => {
    if (msg.startsWith('{')) {
        try {
            const parsed = JSON.parse(msg);
            if (parsed.key) {
                return String(t(parsed.key, parsed));
            }
        } catch {
            // Ignore parse errors for plain text
        }
    }
    return String(t(msg, msg));
};

export const formatRelativeTime = (dateStr: string, t: TFunction): string => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return t('just_now');
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return t('minutes_ago', { count: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('hours_ago', { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('days_ago', { count: diffDays });

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
