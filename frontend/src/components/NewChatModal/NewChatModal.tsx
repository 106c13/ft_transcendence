import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChatObject } from '../ChatSidebar/ChatSidebar'
import styles from './NewChatModal.module.css'

export type Friend = {
	id: number
	username: string
	avatar: string | null
	status?: string
}

type Props = {
	isOpen: boolean
	onClose: () => void
	friends: Friend[]
	chats: ChatObject[]
	onSelectFriend: (friend: Friend) => void
	loading?: boolean
}

export default function NewChatModal({
	isOpen,
	onClose,
	friends,
	chats,
	onSelectFriend,
	loading = false,
}: Props) {
	const { t } = useTranslation()
	const [searchQuery, setSearchQuery] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				setSearchQuery('')
				inputRef.current?.focus()
			}, 30)
			return () => clearTimeout(timer)
		}
	}, [isOpen])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, onClose])

	const filteredFriends = useMemo(() => {
		if (!searchQuery.trim()) return friends
		const q = searchQuery.toLowerCase().trim()
		return friends.filter((f) => f.username.toLowerCase().includes(q))
	}, [friends, searchQuery])

	if (!isOpen) return null

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={styles.modalCard}
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div className={styles.modalHeader}>
					<div className={styles.titleWrapper}>
						<h3 className={styles.modalTitle}>{t('start_conversation', 'Start a Conversation')}</h3>
						<span className={styles.countBadge}>{friends.length}</span>
					</div>
					<button
						className={styles.closeButton}
						onClick={onClose}
						aria-label="Close modal"
					>
						✕
					</button>
				</div>

				<div className={styles.searchContainer}>
					<div className={styles.searchWrapper}>
						<svg
							className={styles.searchIcon}
							width="16"
							height="16"
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
							ref={inputRef}
							type="text"
							className={styles.searchInput}
							placeholder={t('search_friends', 'Search friends...')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>

				<div className={styles.friendsList}>
					{loading ? (
						<div className={styles.emptyState}>
							<span>Loading...</span>
						</div>
					) : friends.length === 0 ? (
						<div className={styles.emptyState}>
							<span className={styles.emptyIcon}>👥</span>
							<div>{t('no_friends_to_chat', "You don't have any friends yet. Add friends to start chatting!")}</div>
							<div className={styles.emptySubtext}>
								{t('add_friends_tip', 'Visit player profiles to send friend requests.')}
							</div>
						</div>
					) : filteredFriends.length === 0 ? (
						<div className={styles.emptyState}>
							<span className={styles.emptyIcon}>🔍</span>
							<div>{t('no_friends_found', 'No friends found')}</div>
							<div className={styles.emptySubtext}>
								{t('try_different_search', 'Try searching for another username.')}
							</div>
						</div>
					) : (
						filteredFriends.map((friend) => {
							const hasChat = chats.some(
								(c) => c.user1_id === friend.id || c.user2_id === friend.id
							)

							const statusClass =
								friend.status === 'ONLINE'
									? styles.online
									: friend.status === 'INGAME'
									? styles.ingame
									: styles.offline

							const statusLabel =
								friend.status === 'ONLINE'
									? t('online', 'Online')
									: friend.status === 'INGAME'
									? t('in_game', 'In Game')
									: t('offline', 'Offline')

							return (
								<div
									key={friend.id}
									className={styles.friendItem}
									onClick={() => onSelectFriend(friend)}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											onSelectFriend(friend)
										}
									}}
								>
									<div className={styles.friendLeft}>
										<div className={styles.avatarWrapper}>
											<img
												src={
													friend.avatar
														? `/uploads/${friend.avatar}`
														: '/assets/default.jpg'
												}
												alt={friend.username}
												className={styles.friendAvatar}
											/>
											<span
												className={`${styles.statusDot} ${statusClass}`}
												title={statusLabel}
											/>
										</div>
										<div className={styles.friendDetails}>
											<span className={styles.friendName}>{friend.username}</span>
											<span className={styles.friendStatusText}>{statusLabel}</span>
										</div>
									</div>

									<div className={styles.friendRight}>
										{hasChat && (
											<span className={styles.chattingBadge}>
												{t('existing_chat', 'Chatting')}
											</span>
										)}
										<button
											type="button"
											className={styles.startChatBtn}
											onClick={(e) => {
												e.stopPropagation()
												onSelectFriend(friend)
											}}
										>
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2.2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
											</svg>
											<span>{t('start_chat', 'Start Chat')}</span>
										</button>
									</div>
								</div>
							)
						})
					)}
				</div>
			</div>
		</div>
	)
}
