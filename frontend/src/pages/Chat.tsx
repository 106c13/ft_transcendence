import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Chat.css'

type User = {
	id: number
	username: string
	email: string
	avatar?: string
}

type Chat = {
	id: number
	chat_id: string
	user1: User
	user2: User
	created_at: string
}

type Message = {
	id: number
	chat_id: string
	sender_id: number
	content: string
	is_read: boolean
	created_at: string
	sender: User
}

function Chat() {
	const navigate = useNavigate()
	const [chats, setChats] = useState<Chat[]>([])
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [newMessage, setNewMessage] = useState('')
	const [currentUser, setCurrentUser] = useState<User | null>(null)

	useEffect(() => {
		const token = localStorage.getItem('token')
		if (!token) {
			navigate('/login')
			return
		}

		fetchCurrentUser()
		fetchChats()
	}, [])

	useEffect(() => {
		if (selectedChat) {
			fetchMessages(selectedChat.chat_id)
		}
	}, [selectedChat])

	const fetchCurrentUser = async () => {
		const token = localStorage.getItem('token')
		try {
			const res = await fetch('/api/users/me', {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				setCurrentUser(data)
			}
		} catch (error) {
			console.error('Error loading user:', error)
		}
	}

	const fetchChats = async () => {
		const token = localStorage.getItem('token')
		try {
			const res = await fetch('/api/chat/my-chats', {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				setChats(data)
				if (data.length > 0) {
					setSelectedChat(data[0])
				}
			}
		} catch (error) {
			console.error('Error loading chats:', error)
		}
	}

	const fetchMessages = async (chatId: string) => {
		const token = localStorage.getItem('token')
		try {
			const res = await fetch(`/api/messages/${chatId}?limit=100`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				setMessages(data.messages)
			}
		} catch (error) {
			console.error('Error loading messages:', error)
		}
	}

	const sendMessage = async () => {
		if (!newMessage.trim() || !selectedChat) return

		const token = localStorage.getItem('token')
		try {
			const res = await fetch('/api/messages/send', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					chat_id: selectedChat.chat_id,
					content: newMessage,
				}),
			})

			if (res.ok) {
				const message = await res.json()
				setMessages([...messages, message])
				setNewMessage('')
			}
		} catch (error) {
			console.error('Error sending message:', error)
		}
	}

	const getOtherUser = (chat: Chat) => {
		if (!currentUser) return null
		return chat.user1.id === currentUser.id ? chat.user2 : chat.user1
	}

	return (
		<div className="chat-container">
			
			<div className="chat-main">
				<div className="chat-list">
					<div className="chat-list-header">
						<h2>Messages</h2>
					</div>
					<div className="chat-list-items">
						{chats.map((chat) => {
							const otherUser = getOtherUser(chat)
							return (
								<div
									key={chat.id}
									className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
									onClick={() => setSelectedChat(chat)}
								>
									<img
										src={otherUser?.avatar ? `/uploads/${otherUser.avatar}` : '/default-avatar.png'}
										alt={otherUser?.username}
										className="chat-avatar"
									/>
									<div className="chat-info">
										<div className="chat-name">{otherUser?.username}</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				<div className="chat-area">
					{selectedChat ? (
						<>
							<div className="chat-header">
								<img
									src={getOtherUser(selectedChat)?.avatar ? `/uploads/${getOtherUser(selectedChat)?.avatar}` : '/default-avatar.png'}
									alt={getOtherUser(selectedChat)?.username}
									className="chat-avatar"
								/>
								<div className="chat-header-info">
									<h3>{getOtherUser(selectedChat)?.username}</h3>
								</div>
							</div>

							<div className="chat-messages">
								{messages.map((msg) => (
									<div
										key={msg.id}
										className={`message ${msg.sender_id === currentUser?.id ? 'sent' : 'received'}`}
									>
										<div className="message-content">{msg.content}</div>
										<div className="message-time">
											{new Date(msg.created_at).toLocaleTimeString()}
										</div>
									</div>
								))}
							</div>

							<div className="chat-input">
								<input
									type="text"
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
									placeholder="Type a message..."
								/>
								<button onClick={sendMessage}>Send</button>
							</div>
						</>
					) : (
						<div className="no-chat-selected">
							<p>Select a chat to start messaging</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default Chat
