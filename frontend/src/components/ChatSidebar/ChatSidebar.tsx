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
}

function ChatSidebar({ chats, selectedChat, currentUserId, onSelectChat }: Props) {
	const getOtherUser = (chat: ChatObject) => {
		if (!currentUserId) return null
		return chat.user1_id === currentUserId ? chat.user2 : chat.user1
	}

	return (
		<div className={styles.chatSidebar}>
			<div className={styles.chatList}>
				{chats.map(chat => {
					const otherUser = getOtherUser(chat)
					return (
						<div
							className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.active : ''}`}
							key={chat.id}
							onClick={() => onSelectChat(chat)}
						>
							<img
								src={otherUser?.avatar ? `/uploads/${otherUser.avatar}` : '/assets/default.jpg'}
								alt={otherUser?.username}
								className={styles.chatAvatar}
							/>
							<div className={styles.chatItemInfo}>
								<div className={styles.chatItemName}>{otherUser?.username}</div>
							</div>
						</div>
					)
				})}
				{chats.length === 0 && (
					<div className={styles.noChats}>No chats yet</div>
				)}
			</div>
		</div>
	)
}

export default ChatSidebar
