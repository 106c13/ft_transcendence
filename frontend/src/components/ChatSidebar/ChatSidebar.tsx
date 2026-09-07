import { useTranslation } from 'react-i18next'
import styles from './ChatSidebar.module.css'

export type ChatObject = {
	id: number
	chat_id: string
	user1_id: number
	user2_id: number
	user1: { id: number; username: string; avatar?: string }
	user2: { id: number; username: string; avatar?: string }
}

type Props = {
	chats: ChatObject[]
	selectedChat: ChatObject | null
	currentUserId: number | null
	onSelectChat: (chat: ChatObject) => void
	activeUserId?: number | null
}

function ChatSidebar({ chats, selectedChat, currentUserId, onSelectChat, activeUserId }: Props) {
	const { t } = useTranslation()

	const getOtherUser = (chat: ChatObject) => {
		if (!currentUserId) return null
		return chat.user1_id === currentUserId ? chat.user2 : chat.user1
	}

	return (
		<div className={styles.chatSidebar}>
			<div className={styles.chatSidebarHeader}>
				<h2>{t('chats', 'Chats')}</h2>
			</div>
			<div className={styles.chatList}>
				{chats.map(chat => {
					const otherUser = getOtherUser(chat)
					const isActive =
						(selectedChat && selectedChat.chat_id === chat.chat_id) ||
						(activeUserId != null && otherUser?.id === activeUserId)

					return (
						<div
							className={`${styles.chatItem} ${isActive ? styles.active : ''}`}
							key={chat.chat_id || chat.id}
							onClick={() => onSelectChat(chat)}
						>
							<img
								src={otherUser?.avatar ? `/uploads/${otherUser.avatar}` : '/assets/default.jpg'}
								alt={otherUser?.username || 'User'}
								className={styles.chatAvatar}
							/>
							<div className={styles.chatItemInfo}>
								<div className={styles.chatItemName}>{otherUser?.username || 'User'}</div>
							</div>
						</div>
					)
				})}
				{chats.length === 0 && (
					<div className={styles.noChats}>{t('no_chats_yet', 'No chats yet')}</div>
				)}
			</div>
		</div>
	)
}

export default ChatSidebar
