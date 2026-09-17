import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ChatObject } from '../ChatSidebar/ChatSidebar'
import type { Friend } from '../NewChatModal/NewChatModal'
import styles from './ChatMain.module.css'

export type Message = {
	id: number
	chat_id: string
	sender_id: number
	content: string
	created_at: string
	sender?: { id: number; username: string; avatar?: string }
}

type Props = {
	selectedChat: ChatObject | null
	messages: Message[]
	newMessage: string
	currentUserId: number | null
	onNewMessageChange: (value: string) => void
	onSendMessage: () => void
	onBackToChats?: () => void
	onOpenNewChat?: () => void
	friends?: Friend[]
	friendStatusMap?: Map<number, string>
	isMobileHidden?: boolean
	onSelectFriend?: (friend: Friend) => void
}

function formatMessageTime(dateStr: string): string {
	try {
		const date = new Date(dateStr)
		if (isNaN(date.getTime())) return ''
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	} catch {
		return ''
	}
}

function ChatMain({
	selectedChat,
	messages,
	newMessage,
	currentUserId,
	onNewMessageChange,
	onSendMessage,
	onBackToChats,
	onOpenNewChat,
	friends = [],
	friendStatusMap,
	isMobileHidden = false,
	onSelectFriend,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const messagesContainerRef = useRef<HTMLDivElement>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const prevChatIdRef = useRef<string | null>(null)

	const getOtherUser = (chat: ChatObject) => {
		if (!currentUserId) return null
		return chat.user1_id === currentUserId ? chat.user2 : chat.user1
	}

	const otherUser = selectedChat ? getOtherUser(selectedChat) : null

	const otherUserStatus =
		(otherUser?.id && friendStatusMap?.get(otherUser.id)) ||
		otherUser?.status

	const statusClass =
		otherUserStatus === 'ONLINE'
			? styles.online
			: otherUserStatus === 'INGAME'
			? styles.ingame
			: otherUserStatus === 'OFFLINE'
			? styles.offline
			: null

	const statusLabel =
		otherUserStatus === 'ONLINE'
			? t('online', 'Online')
			: otherUserStatus === 'INGAME'
			? t('in_game', 'In Game')
			: t('offline', 'Offline')

	// Always scroll down when messages change or chat changes
	useEffect(() => {
		if (!selectedChat) return

		const isDifferentChat = prevChatIdRef.current !== selectedChat.chat_id
		prevChatIdRef.current = selectedChat.chat_id
		const behavior: ScrollBehavior = isDifferentChat ? 'auto' : 'smooth'

		const timer = setTimeout(() => {
			if (messagesContainerRef.current) {
				messagesContainerRef.current.scrollTo({
					top: messagesContainerRef.current.scrollHeight,
					behavior,
				})
			}
			messagesEndRef.current?.scrollIntoView({ behavior })
		}, 50)

		return () => clearTimeout(timer)
	}, [messages, selectedChat])

	return (
		<main
			className={`${styles.chatMain} ${
				isMobileHidden ? styles.hiddenOnMobile : ''
			}`}
		>
			{selectedChat && otherUser ? (
				<>
					<div className={styles.chatMainHeader}>
						<div className={styles.headerLeft}>
							{onBackToChats && (
								<button
									type="button"
									className={styles.backButton}
									onClick={onBackToChats}
									aria-label={t('back_to_chats', 'Back to chats')}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polyline points="15 18 9 12 15 6" />
									</svg>
									<span>{t('chats', 'Chats')}</span>
								</button>
							)}

							<div
								className={styles.headerUserInfo}
								onClick={() => {
									if (otherUser.username) {
										navigate(`/profile/${otherUser.username}`)
									}
								}}
							>
								<div className={styles.avatarWrapper}>
									<img
										src={
											otherUser.avatar
												? `/uploads/${otherUser.avatar}`
												: '/assets/default.jpg'
										}
										alt={otherUser.username || 'User'}
										className={styles.chatMainAvatar}
									/>
									{statusClass && (
										<span
											className={`${styles.statusDot} ${statusClass}`}
											title={statusLabel}
										/>
									)}
								</div>
								<div className={styles.userNameGroup}>
									<h3>{otherUser.username}</h3>
									{otherUserStatus && (
										<span className={styles.userStatusSubtitle}>
											{statusLabel}
										</span>
									)}
								</div>
							</div>
						</div>

						<div className={styles.headerActions}>
							<button
								type="button"
								className={styles.viewProfileBtn}
								onClick={() => {
									if (otherUser.username) {
										navigate(`/profile/${otherUser.username}`)
									}
								}}
								title={t('view_profile', 'View Profile')}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
									<circle cx="12" cy="7" r="4" />
								</svg>
								<span>{t('view_profile', 'View Profile')}</span>
							</button>
						</div>
					</div>

					<div ref={messagesContainerRef} className={styles.chatMessages}>
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`${styles.message} ${
									msg.sender_id === currentUserId ? styles.sent : styles.received
								}`}
							>
								<div className={styles.messageBubble}>{msg.content}</div>
								<div className={styles.messageTime}>
									{formatMessageTime(msg.created_at)}
								</div>
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>

					<div className={styles.chatInputArea}>
						<input
							type="text"
							value={newMessage}
							onChange={(e) => onNewMessageChange(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault()
									onSendMessage()
								}
							}}
							placeholder={t('type_message', 'Type a message...')}
						/>
						<button
							type="button"
							className={styles.sendButton}
							onClick={onSendMessage}
							disabled={!newMessage.trim()}
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="22" y1="2" x2="11" y2="13" />
								<polygon points="22 2 15 22 11 13 2 9 22 2" />
							</svg>
							<span>{t('send', 'Send')}</span>
						</button>
					</div>
				</>
			) : (
				<div className={styles.emptyChatContainer}>
					<div className={styles.emptyChatCard}>
						<div className={styles.emptyChatIconWrapper}>
							<svg
								width="36"
								height="36"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
							</svg>
						</div>
						<h2 className={styles.emptyChatTitle}>
							{t('your_messages', 'Your Messages')}
						</h2>
						<p className={styles.emptyChatSubtitle}>
							{t(
								'select_chat_desc',
								'Select a conversation from the sidebar or start a new chat with a friend.'
							)}
						</p>

						{onOpenNewChat && (
							<button
								type="button"
								className={styles.startNewChatBtn}
								onClick={onOpenNewChat}
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="12" y1="5" x2="12" y2="19" />
									<line x1="5" y1="12" x2="19" y2="12" />
								</svg>
								<span>{t('start_conversation', 'Start a Conversation')}</span>
							</button>
						)}

						{friends.length > 0 && onSelectFriend && (
							<div className={styles.quickFriendsSection}>
								<span className={styles.quickFriendsLabel}>
									{t('friends_title', 'Friends')}
								</span>
								<div className={styles.quickFriendsGrid}>
									{friends.slice(0, 6).map((friend) => (
										<div
											key={friend.id}
											className={styles.quickFriendChip}
											onClick={() => onSelectFriend(friend)}
											role="button"
											tabIndex={0}
											title={`${friend.username}`}
										>
											<div className={styles.quickFriendAvatarWrapper}>
												<img
													src={
														friend.avatar
															? `/uploads/${friend.avatar}`
															: '/assets/default.jpg'
													}
													alt={friend.username}
													className={styles.quickFriendAvatar}
												/>
											</div>
											<span className={styles.quickFriendName}>
												{friend.username}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</main>
	)
}

export default ChatMain