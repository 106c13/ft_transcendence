import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Search, Plus } from 'lucide-react';
import styles from './ChatSidebar.module.css';

import type { ChatObject } from '../../utils/chatUtils';
export type { ChatObject };

type Props = {
	chats: ChatObject[];
	selectedChat: ChatObject | null;
	currentUserId: number | null;
	onSelectChat: (chat: ChatObject) => void;
	activeUserId?: number | null;
	onOpenNewChat: () => void;
	friendStatusMap?: Map<number, string>;
	isMobileHidden?: boolean;
};

function formatChatTime(dateStr?: string): string {
	if (!dateStr) return '';
	try {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '';
		const now = new Date();
		const isToday =
			date.getDate() === now.getDate() &&
			date.getMonth() === now.getMonth() &&
			date.getFullYear() === now.getFullYear();

		if (isToday) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
	} catch {
		return '';
	}
}

const ChatSidebar = ({
	chats,
	selectedChat,
	currentUserId,
	onSelectChat,
	activeUserId,
	onOpenNewChat,
	friendStatusMap,
	isMobileHidden = false,
}: Props) => {
	const { t } = useTranslation()
	const [searchQuery, setSearchQuery] = useState('')

	const getOtherUser = useCallback(
		(chat: ChatObject) => {
			if (!currentUserId) return null
			return chat.user1_id === currentUserId ? chat.user2 : chat.user1
		},
		[currentUserId]
	)

	const filteredChats = useMemo(() => {
		if (!searchQuery.trim()) return chats
		const query = searchQuery.toLowerCase().trim()
		return chats.filter((chat) => {
			const other = getOtherUser(chat)
			return other?.username.toLowerCase().includes(query)
		})
	}, [chats, searchQuery, getOtherUser])

	return (
		<aside
			className={`${styles.chatSidebar} ${
				isMobileHidden ? styles.hiddenOnMobile : ''
			}`}
		>
			<div className={styles.chatSidebarHeader}>
				<div className={styles.headerTop}>
					<div className={styles.titleGroup}>
						<h2>{t('chats')}</h2>
						<span className={styles.chatCountBadge}>{chats.length}</span>
					</div>
					<button
						type="button"
						className={styles.newChatButton}
						onClick={onOpenNewChat}
						title={t('new_chat')}
					>
						<Plus size={15} strokeWidth={2.5} aria-hidden="true" />
						<span>{t('new_chat')}</span>
					</button>
				</div>

				<div className={styles.searchContainer}>
					<Search size={14} className={styles.searchIcon} aria-hidden="true" />
					<input
						type="text"
						className={styles.searchInput}
						placeholder={t('search_chats')}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className={styles.chatList}>
				{filteredChats.map((chat) => {
					const otherUser = getOtherUser(chat)
					const isActive =
						(selectedChat && selectedChat.chat_id === chat.chat_id) ||
						(activeUserId != null && otherUser?.id === activeUserId)

					const userStatus =
						(otherUser?.id && friendStatusMap?.get(otherUser.id)) ||
						otherUser?.status

					const statusClass =
						userStatus === 'ONLINE'
							? styles.online
							: userStatus === 'INGAME'
							? styles.ingame
							: userStatus === 'OFFLINE'
							? styles.offline
							: null

					const lastMsgText =
						typeof chat.lastMessage === 'string'
							? chat.lastMessage
							: chat.lastMessage?.content || ''

					const lastMsgTime =
						typeof chat.lastMessage === 'object' && chat.lastMessage?.created_at
							? formatChatTime(chat.lastMessage.created_at)
							: ''

					return (
						<div
							className={`${styles.chatItem} ${isActive ? styles.active : ''}`}
							key={chat.chat_id || chat.id}
							onClick={() => onSelectChat(chat)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									onSelectChat(chat)
								}
							}}
						>
							<div className={styles.avatarWrapper}>
								<img
									src={
										otherUser?.avatar
											? `/uploads/${otherUser.avatar}`
											: '/assets/default.jpg'
									}
									alt={otherUser?.username || 'User'}
									className={styles.chatAvatar}
								/>
								{statusClass && (
									<span
										className={`${styles.statusDot} ${statusClass}`}
										title={
											userStatus === 'ONLINE'
												? t('online')
												: userStatus === 'INGAME'
												? t('in_game')
												: t('offline')
										}
									/>
								)}
							</div>
							<div className={styles.chatItemInfo}>
								<div className={styles.chatItemHeader}>
									<span className={styles.chatItemName}>
										{otherUser?.username || 'User'}
									</span>
									{lastMsgTime && (
										<span className={styles.chatItemTime}>{lastMsgTime}</span>
									)}
								</div>
								<div className={styles.chatItemBottom}>
									<span className={styles.chatItemSnippet}>
										{lastMsgText}
									</span>
									{typeof chat.unreadCount === 'number' &&
										chat.unreadCount > 0 && (
											<span className={styles.unreadBadge}>
												{chat.unreadCount > 99 ? '99+' : chat.unreadCount}
											</span>
										)}
								</div>
							</div>
						</div>
					)
				})}

				{chats.length === 0 ? (
					<div className={styles.noChats}>
						<MessageSquare size={32} className={styles.noChatsIcon} aria-hidden="true" />
						<span className={styles.noChatsText}>
							{t('no_chats_yet')}
						</span>
						<button
							type="button"
							className={styles.startChatAction}
							onClick={onOpenNewChat}
						>
							{t('start_chat')}
						</button>
					</div>
				) : filteredChats.length === 0 ? (
					<div className={styles.noChats}>
						<Search size={32} className={styles.noChatsIcon} aria-hidden="true" />
						<span className={styles.noChatsText}>
							{t('no_chats_found')}
						</span>
					</div>
				) : null}
			</div>
		</aside>
	);
};

export default ChatSidebar;
