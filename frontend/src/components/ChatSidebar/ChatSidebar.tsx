import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './ChatSidebar.module.css'

export type ChatObject = {
	id: number
	chat_id: string
	user1_id: number
	user2_id: number
	user1: { id: number; username: string; avatar?: string; status?: string }
	user2: { id: number; username: string; avatar?: string; status?: string }
	unreadCount?: number
	lastMessage?: { id?: number; content?: string; created_at?: string; sender_id?: number } | string | null
}

type Props = {
	chats: ChatObject[]
	selectedChat: ChatObject | null
	currentUserId: number | null
	onSelectChat: (chat: ChatObject) => void
	activeUserId?: number | null
	onOpenNewChat: () => void
	friendStatusMap?: Map<number, string>
	isMobileHidden?: boolean
}

function formatChatTime(dateStr?: string): string {
	if (!dateStr) return ''
	try {
		const date = new Date(dateStr)
		if (isNaN(date.getTime())) return ''
		const now = new Date()
		const isToday =
			date.getDate() === now.getDate() &&
			date.getMonth() === now.getMonth() &&
			date.getFullYear() === now.getFullYear()

		if (isToday) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		}
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
	} catch {
		return ''
	}
}

function ChatSidebar({
	chats,
	selectedChat,
	currentUserId,
	onSelectChat,
	activeUserId,
	onOpenNewChat,
	friendStatusMap,
	isMobileHidden = false,
}: Props) {
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
						<h2>{t('chats', 'Chats')}</h2>
						<span className={styles.chatCountBadge}>{chats.length}</span>
					</div>
					<button
						type="button"
						className={styles.newChatButton}
						onClick={onOpenNewChat}
						title={t('new_chat', 'New Chat')}
					>
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						<span>{t('new_chat', 'New Chat')}</span>
					</button>
				</div>

				<div className={styles.searchContainer}>
					<svg
						className={styles.searchIcon}
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						type="text"
						className={styles.searchInput}
						placeholder={t('search_chats', 'Search chats...')}
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
												? t('online', 'Online')
												: userStatus === 'INGAME'
												? t('in_game', 'In Game')
												: t('offline', 'Offline')
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
						<span className={styles.noChatsIcon}>💬</span>
						<span className={styles.noChatsText}>
							{t('no_chats_yet', 'No chats yet')}
						</span>
						<button
							type="button"
							className={styles.startChatAction}
							onClick={onOpenNewChat}
						>
							{t('start_chat', 'Start Chat')}
						</button>
					</div>
				) : filteredChats.length === 0 ? (
					<div className={styles.noChats}>
						<span className={styles.noChatsIcon}>🔍</span>
						<span className={styles.noChatsText}>
							{t('no_chats_found', 'No chats found matching search')}
						</span>
					</div>
				) : null}
			</div>
		</aside>
	)
}

export default ChatSidebar
