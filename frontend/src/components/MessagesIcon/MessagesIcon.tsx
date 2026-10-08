import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import Tooltip from '../Tooltip/Tooltip';
import styles from './MessagesIcon.module.css';

type Props = {
	userId?: number;
};

const MessagesIcon = ({ userId }: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const [unreadCount, setUnreadCount] = useState(0);

	const isChatActive = location.pathname === '/chat' || location.pathname.startsWith('/chat/');

	const fetchUnreadCount = useCallback(async () => {
		if (!userId) return;
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const res = await fetch('/api/messages/unread/total', {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setUnreadCount(data.count ?? 0);
			}
		} catch (err) {
			console.error('Error fetching unread messages count:', err);
		}
	}, [userId]);

	useEffect(() => {
		if (!userId) return;

		const initialTimer = setTimeout(fetchUnreadCount, 0);
		const interval = setInterval(fetchUnreadCount, 3000);

		const handleMessagesRead = () => {
			fetchUnreadCount();
		};

		window.addEventListener('messages_read', handleMessagesRead);
		window.addEventListener('focus', handleMessagesRead);
		document.addEventListener('visibilitychange', handleMessagesRead);

		return () => {
			clearTimeout(initialTimer);
			clearInterval(interval);
			window.removeEventListener('messages_read', handleMessagesRead);
			window.removeEventListener('focus', handleMessagesRead);
			document.removeEventListener('visibilitychange', handleMessagesRead);
		};
	}, [userId, fetchUnreadCount]);

	return (
		<Tooltip content={t('chat')} position="bottom" offset="navbar">
			<div
				className={`${styles.messagesActionItem} ${isChatActive ? styles.active : ''}`}
				onClick={() => navigate('/chat')}
				role="button"
				tabIndex={0}
				aria-label={t('chat')}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						navigate('/chat');
					}
				}}
			>
				<span className={styles.messagesIcon}>
					<MessageSquare size={18} aria-hidden="true" />
				</span>
				{unreadCount > 0 && (
					<span className={styles.notificationBadge}>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</div>
		</Tooltip>
	);
};

export default MessagesIcon;
