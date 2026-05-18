import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Chat.css'

type Chat = {
	id: number
	chat_id: string
	user1_id: number
	user2_id: number
	user1: { id: number; username: string; avatar?: string }
	user2: { id: number; username: string; avatar?: string }
	created_at: string
}

type Message = {
	id: number
	chat_id: string
	sender_id: number
	content: string
	created_at: string
}

function Chat() {
	const navigate = useNavigate()
	const { user_id } = useParams()
	const [chats, setChats] = useState<Chat[]>([])
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [newMessage, setNewMessage] = useState('')
	const [currentUserId, setCurrentUserId] = useState<number | null>(null)

	const token = localStorage.getItem('token')

	// Get current user ID
	useEffect(() => {
		if (!token) {
			navigate('/login')
			return
		}
		fetch('/api/users/me', {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => setCurrentUserId(data.id))
			.catch(err => console.error(err))
	}, [])

	// Fetch all chats
	useEffect(() => {
		if (!currentUserId) return

		fetch('/api/chat/my-chats', {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				setChats(data)
			})
			.catch(err => console.error(err))
	}, [currentUserId])

	useEffect(() => {
		if (!currentUserId || !user_id) return

		fetch(`/api/chat/get/${user_id}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(chat => {
				setSelectedChat(chat)
				return fetch(`/api/messages/${chat.chat_id}?limit=100`, {
					headers: { Authorization: `Bearer ${token}` }
				})
			})
			.then(res => res.json())
			.then(data => {
				setMessages(data.messages || [])
			})
			.catch(err => console.error(err))
	}, [user_id, currentUserId])

	useEffect(() => {
		if (!selectedChat) return

		fetch(`/api/messages/${selectedChat.chat_id}?limit=100`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				setMessages(data.messages || [])
			})
			.catch(err => console.error(err))
	}, [selectedChat])

	const sendMessage = async () => {
		if (!newMessage.trim() || !selectedChat) return

		const res = await fetch('/api/messages/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				chat_id: selectedChat.chat_id,
				content: newMessage
			})
		})

		if (res.ok) {
			const message = await res.json()
			setMessages([...messages, message])
			setNewMessage('')
		}
	}

	const getOtherUser = (chat: Chat) => {
		if (!currentUserId) return null
		return chat.user1_id === currentUserId ? chat.user2 : chat.user1
	}

	if (!currentUserId) {
		return <div className="chat-container">Loading...</div>
	}

	return (
		<div className="chat-container">
			<div className="chat-sidebar">
				<div
					className="chat-sidebar-header"
					onClick={() => navigate('/home')}
				>
					<h2>ft_transcendence</h2>
				</div>
				<div className="chat-list">
					{chats.map(chat => {
						const otherUser = getOtherUser(chat)
						return (
							// In the chat list
							<div className="chat-item" key={chat.id} onClick={() => setSelectedChat(chat)} >
								<img
									src={otherUser?.avatar ? `/uploads/${otherUser.avatar}` : '/assets/default.jpg'}
									alt={otherUser?.username}
									className="chat-avatar"
								/>
								<div className="chat-item-info">
									<div className="chat-item-name">{otherUser?.username}</div>
								</div>
							</div>
						)
					})}
					{chats.length === 0 && (
						<div className="no-chats">No chats yet</div>
					)}
				</div>
			</div>

			<div className="chat-main">
				{selectedChat ? (
					<>
						<div className="chat-main-header"
							onClick={() => navigate(`/profile/${getOtherUser(selectedChat)?.username}`)}
						>
							<img
								src={getOtherUser(selectedChat)?.avatar ? `/uploads/${getOtherUser(selectedChat)?.avatar}` : '/assets/default.jpg'}
								alt={getOtherUser(selectedChat)?.username}
								className="chat-main-avatar"
							/>
							<h3>{getOtherUser(selectedChat)?.username}</h3>
						</div>
						<div className="chat-messages">
							{messages.map(msg => (
								<div
									key={msg.id}
									className={`message ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}
								>
									<div className="message-bubble">{msg.content}</div>
									<div className="message-time">
										{new Date(msg.created_at).toLocaleTimeString()}
									</div>
								</div>
							))}
						</div>

						<div className="chat-input-area">
							<input
								type="text"
								value={newMessage}
								onChange={e => setNewMessage(e.target.value)}
								onKeyPress={e => e.key === 'Enter' && sendMessage()}
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
	)
}

export default Chat
