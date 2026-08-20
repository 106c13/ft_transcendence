import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import io, { Socket } from 'socket.io-client'
import './Chat.css'
import Navbar from '../components/Navbar'

type Chat = {
	id: number
	chat_id: string
	user1_id: number
	user2_id: number
	user1: { id: number; username: string; avatar?: string }
	user2: { id: number; username: string; avatar?: string }
}

type Message = {
	id: number
	chat_id: string
	sender_id: number
	content: string
	created_at: string
	sender?: { id: number; username: string; avatar?: string }
}

function Chat() {
	const navigate = useNavigate()
	const { user_id } = useParams()
	const [chats, setChats] = useState<Chat[]>([])
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [newMessage, setNewMessage] = useState('')
	const [currentUserId, setCurrentUserId] = useState<number | null>(null)
	const [currentUser, setCurrentUser] = useState<any>(null)
	const { t } = useTranslation()
	const socketRef = useRef<Socket | null>(null)
	const selectedChatRef = useRef(selectedChat) // ADD THIS

	const token = localStorage.getItem('token')

	// Update ref when selectedChat changes
	useEffect(() => {
		selectedChatRef.current = selectedChat
	}, [selectedChat])

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
			.then(data => {
				setCurrentUserId(data.id)
				setCurrentUser(data)
			})
			.catch(err => console.error(err))
	}, [])

	// Connect to Socket.io
	useEffect(() => {
		if (!currentUserId) return

		const socket = io('/chat', {
			query: { userId: currentUserId.toString() },
			transports: ['websocket'],
		})
		socketRef.current = socket

		socket.on('connect', () => {
			console.log('Socket connected')
		})

		socket.on('new_message', (data: { type: string; message: Message }) => {
			console.log('New message received:', data)
			const newMsg = data.message
			
			// Use ref instead of selectedChat state
			if (selectedChatRef.current && newMsg.chat_id === selectedChatRef.current.chat_id) {
				setMessages(prev => [...prev, newMsg])
			}
		})

		socket.on('disconnect', () => {
			console.log('Socket disconnected')
		})

		return () => {
			socket.disconnect()
		}
	}, [currentUserId]) // Remove selectedChat from here

	// Fetch all chats
	const refreshChats = () => {
		if (!currentUserId) return

		fetch('/api/chat/my-chats', {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				setChats(data)
			})
			.catch(err => console.error(err))
	}

	useEffect(() => {
		if (!currentUserId) return
		refreshChats()
	}, [currentUserId])

	// Handle URL parameter (user_id)
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

	// Handle clicking on chat from sidebar
	useEffect(() => {
		if (!selectedChat || user_id) return

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
			setNewMessage('')
			
			const otherUser = getOtherUser(selectedChat)
			if (socketRef.current && otherUser) {
				socketRef.current.emit('send_message', {
					receiver_id: otherUser.id,
					chat_id: selectedChat.chat_id,
					message: message
				})
			}
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
		<div className="chat-page">
			<Navbar currentUser={currentUser} />
			<div className="chat-container">
			<div className="chat-sidebar">
				<div className="chat-list">
					{chats.map(chat => {
						const otherUser = getOtherUser(chat)
						return (
							<div 
								className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
								key={chat.id} 
								onClick={() => {
									setSelectedChat(chat)
									if (user_id) {
										navigate('/chat', { replace: true })
									}
								}} 
							>
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
						<div 
							className="chat-main-header"
							onClick={() => {
								const otherUser = getOtherUser(selectedChat)
								if (otherUser) {
									navigate(`/profile/${otherUser.username}`)
								}
							}}
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
								placeholder={t('type_message')}
							/>
							<button onClick={sendMessage}>{t('send')}</button>
						</div>
					</>
				) : (
					<div className="no-chat-selected">
						<p>{t('select_chat')}</p>
					</div>
				)}
			</div>
			</div>
		</div>
	)
}

export default Chat
