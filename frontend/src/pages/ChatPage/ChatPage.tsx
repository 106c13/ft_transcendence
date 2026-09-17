import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import type { LayoutContextType } from '../../layouts/MainLayout'
import { useChat } from '../../hooks/useChat'
import ChatSidebar from '../../components/ChatSidebar/ChatSidebar'
import ChatMain from '../../components/ChatMain/ChatMain'
import NewChatModal, { type Friend } from '../../components/NewChatModal/NewChatModal'
import styles from './ChatPage.module.css'

function ChatPage() {
	const navigate = useNavigate()
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
		userIdParam,
	} = useChat(currentUserId)

	const currentUsername = currentUser?.username

	const [friends, setFriends] = useState<Friend[]>([])
	const [loadingFriends, setLoadingFriends] = useState(false)
	const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)

	// Fetch friends list for current user
	const loadFriends = useCallback(async () => {
		if (!currentUsername) return

		const token = localStorage.getItem('token')
		if (!token) return

		setLoadingFriends(true)
		try {
			const res = await fetch(`/api/friends/list/${currentUsername}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				if (Array.isArray(data)) {
					setFriends(data)
				}
			}
		} catch (err) {
			console.error('Failed to load friends for chat:', err)
		} finally {
			setLoadingFriends(false)
		}
	}, [currentUsername])

	useEffect(() => {
		if (!currentUsername) return
		const token = localStorage.getItem('token')
		if (!token) return

		let isMounted = true
		fetch(`/api/friends/list/${currentUsername}`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => {
				if (isMounted && Array.isArray(data)) {
					setFriends(data)
				}
			})
			.catch((err) => console.error('Failed to load friends for chat:', err))

		return () => {
			isMounted = false
		}
	}, [currentUsername])

	// Create a fast lookup map for friend presence statuses (ONLINE / INGAME / OFFLINE)
	const friendStatusMap = useMemo(() => {
		const map = new Map<number, string>()
		friends.forEach((friend) => {
			if (friend.status) {
				map.set(friend.id, friend.status)
			}
		})
		return map
	}, [friends])

	const handleOpenNewChat = () => {
		setIsNewChatModalOpen(true)
		// Refresh friends list when opening the modal to get up-to-date presence
		loadFriends()
	}

	const handleCloseNewChat = () => {
		setIsNewChatModalOpen(false)
	}

	const handleSelectFriend = (friend: Friend) => {
		setIsNewChatModalOpen(false)
		const existingChat = chats.find(
			(c) => c.user1_id === friend.id || c.user2_id === friend.id
		)

		if (existingChat) {
			handleSelectChat(existingChat)
		} else {
			navigate(`/chat/${friend.id}`)
		}
	}

	const handleBackToChats = () => {
		navigate('/chat')
	}

	if (!currentUserId) {
		return (
			<div className={styles.loadingContainer}>
				<div className={styles.loadingSpinner} />
				<span>Loading chat...</span>
			</div>
		)
	}

	const isMobileChatOpen = Boolean(selectedChat || userIdParam)

	return (
		<div className={styles.chatContainer}>
			<div className={styles.chatContent}>
				<ChatSidebar
					chats={chats}
					selectedChat={selectedChat}
					currentUserId={currentUserId}
					onSelectChat={handleSelectChat}
					activeUserId={userIdParam}
					onOpenNewChat={handleOpenNewChat}
					friendStatusMap={friendStatusMap}
					isMobileHidden={isMobileChatOpen}
				/>
				<ChatMain
					selectedChat={selectedChat}
					messages={messages}
					newMessage={newMessage}
					currentUserId={currentUserId}
					onNewMessageChange={setNewMessage}
					onSendMessage={sendMessage}
					onBackToChats={handleBackToChats}
					onOpenNewChat={handleOpenNewChat}
					friends={friends}
					friendStatusMap={friendStatusMap}
					isMobileHidden={!isMobileChatOpen}
					onSelectFriend={handleSelectFriend}
				/>
			</div>

			<NewChatModal
				isOpen={isNewChatModalOpen}
				onClose={handleCloseNewChat}
				friends={friends}
				chats={chats}
				onSelectFriend={handleSelectFriend}
				loading={loadingFriends}
			/>
		</div>
	)
}

export default ChatPage