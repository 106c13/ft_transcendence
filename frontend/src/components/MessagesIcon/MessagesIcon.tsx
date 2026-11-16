import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import NavTooltip from '../NavTooltip/NavTooltip';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import styles from './MessagesIcon.module.css';

type Props = {
	userId?: number;
	onUnreadChange?: (count: number) => void;
};

const MessagesIcon = ({ userId, onUnreadChange }: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { unreadCount } = useUnreadMessages(userId);

	const isChatActive = location.pathname === '/chat' || location.pathname.startsWith('/chat/');

	useEffect(() => {
		onUnreadChange?.(unreadCount);
	}, [unreadCount, onUnreadChange]);

	return (
		<NavTooltip content={t('chat')} position="bottom" offset="navbar">
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
				<span className={styles.navLabel}>{t('chat')}</span>
				{unreadCount > 0 && (
					<span className={styles.notificationBadge}>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</div>
		</NavTooltip>
	);
};

export default MessagesIcon;