import { useOutletContext } from 'react-router-dom'
import type { LayoutContextType } from '../../layouts/MainLayout'
import { useChat } from '../../hooks/useChat'
import ChatSidebar from '../../components/ChatSidebar/ChatSidebar'
import ChatMain from '../../components/ChatMain/ChatMain'
import styles from './Chat.module.css'

function Chat() {
	const { currentUser } = useOutletContext<LayoutContextType>()
	const currentUserId = currentUser?.id ?? null

	const {
		chats,
		selectedChat,
		messages,
		newMessage,
		setNewMessage,
		sendMessage,
		handleSelectChat,
	} = useChat(currentUserId)

	if (!currentUserId) {
		return <div className={styles.chatContainer}>Loading...</div>
	}

	return (
		<div className={styles.chatContainer}>
			<main className={styles.chatContent}>
				<ChatSidebar
					chats={chats}
					selectedChat={selectedChat}
					currentUserId={currentUserId}
					onSelectChat={handleSelectChat}
				/>
				<ChatMain
					selectedChat={selectedChat}
					messages={messages}
					newMessage={newMessage}
					currentUserId={currentUserId}
					onNewMessageChange={setNewMessage}
					onSendMessage={sendMessage}
				/>
			</main>
		</div>
	)
}

export default Chat