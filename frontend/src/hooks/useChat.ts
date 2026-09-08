import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import io, { Socket } from 'socket.io-client'
import type { ChatObject } from '../components/ChatSidebar/ChatSidebar'
import type { Message } from '../components/ChatMain/ChatMain'

export function useChat(currentUserId: number | null) {
	const navigate = useNavigate()
	const { user_id } = useParams<{ user_id?: string }>()
	const [chats, setChats] = useState<ChatObject[]>([])
	const [selectedChat, setSelectedChat] = useState<ChatObject | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [newMessage, setNewMessage] = useState('')
	const socketRef = useRef<Socket | null>(null)
	const selectedChatRef = useRef(selectedChat)

	const token = localStorage.getItem('token')

	useEffect(() => {
		selectedChatRef.current = selectedChat
	}, [selectedChat])

	const getOtherUser = useCallback((chat: ChatObject) => {
		if (!currentUserId) return null
		return chat.user1_id === currentUserId ? chat.user2 : chat.user1
	}, [currentUserId])

	// Load chat list
	const refreshChats = useCallback(() => {
		if (!currentUserId || !token) return

		fetch('/api/chat/my-chats', {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => {
				if (!res.ok) throw new Error('Failed to fetch chats')
				return res.json()
			})
			.then(data => {
				if (Array.isArray(data)) {
					setChats(data)
				}
			})
			.catch(err => console.error('Error fetching chats:', err))
	}, [currentUserId, token])

	useEffect(() => {
		refreshChats()
	}, [refreshChats])

	const markChatAsRead = useCallback((chatId: string) => {
		if (!token) return
		fetch(`/api/messages/read/${chatId}`, {
			method: 'PATCH',
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(() => {
				setChats(prev =>
					prev.map(c => (c.chat_id === chatId ? { ...c, unreadCount: 0 } : c))
				)
				window.dispatchEvent(new CustomEvent('messages_read'))
			})
			.catch(err => console.error('Error marking chat read:', err))
	}, [token])

	// Socket connection
	useEffect(() => {
		if (!currentUserId) return

		const socket = io('/chat', {
			query: { userId: currentUserId.toString() },
			transports: ['websocket', 'polling'],
		})
		socketRef.current = socket

		socket.on('connect', () => {
			console.log('Chat socket connected')
		})

		socket.on('new_message', (data: { type: string; message: Message }) => {
			const newMsg = data?.message
			if (!newMsg) return

			const isCurrentChat =
				selectedChatRef.current && newMsg.chat_id === selectedChatRef.current.chat_id

			if (isCurrentChat) {
				setMessages(prev => {
					if (prev.some(m => m.id === newMsg.id)) return prev
					return [...prev, { ...newMsg, is_read: true }]
				})

				if (newMsg.sender_id !== currentUserId) {
					markChatAsRead(newMsg.chat_id)
				}

				setChats(prev =>
					prev.map(c =>
						c.chat_id === newMsg.chat_id
							? { ...c, unreadCount: 0, lastMessage: newMsg }
							: c
					)
				)
			} else {
				refreshChats()
				window.dispatchEvent(new CustomEvent('messages_read'))
			}
		})

		socket.on('messages_read', (data: { chat_id: string; reader_id: number }) => {
			if (data?.reader_id === currentUserId) {
				setChats(prev =>
					prev.map(c =>
						c.chat_id === data.chat_id ? { ...c, unreadCount: 0 } : c
					)
				)
				window.dispatchEvent(new CustomEvent('messages_read'))
			}
		})

		socket.on('disconnect', () => {
			console.log('Chat socket disconnected')
		})

		return () => {
			socket.disconnect()
		}
	}, [currentUserId, refreshChats, markChatAsRead])

	// Sync active chat and messages with URL param (/chat/:user_id)
	useEffect(() => {
		if (!currentUserId) return

		// When on /chat without user_id, clear selected chat
		if (!user_id) {
			setSelectedChat(null)
			setMessages([])
			return
		}

		const targetUserId = parseInt(user_id, 10)
		if (isNaN(targetUserId) || targetUserId === currentUserId) {
			navigate('/chat', { replace: true })
			return
		}

		let isMounted = true

		// Optimistically select chat if it exists in current chats list
		const existingChat = chats.find(
			c => c.user1_id === targetUserId || c.user2_id === targetUserId
		)
		if (existingChat) {
			setSelectedChat(existingChat)
			markChatAsRead(existingChat.chat_id)
		}

		// Fetch full chat object from backend
		fetch(`/api/chat/get/${user_id}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => {
				if (!res.ok) throw new Error('Chat not found')
				return res.json()
			})
			.then(chat => {
				if (!isMounted || !chat?.chat_id) return

				setSelectedChat(chat)
				markChatAsRead(chat.chat_id)

				setChats(prev => {
					if (prev.some(c => c.chat_id === chat.chat_id)) {
						return prev.map(c => (c.chat_id === chat.chat_id ? { ...chat, unreadCount: 0 } : c))
					}
					return [{ ...chat, unreadCount: 0 }, ...prev]
				})

				return fetch(`/api/messages/${chat.chat_id}?limit=100`, {
					headers: { Authorization: `Bearer ${token}` }
				})
			})
			.then(res => {
				if (!res) return
				if (!res.ok) throw new Error('Failed to fetch messages')
				return res.json()
			})
			.then(data => {
				if (!isMounted || !data) return
				setMessages(data.messages || [])
				if (selectedChatRef.current?.chat_id) {
					markChatAsRead(selectedChatRef.current.chat_id)
				}
			})
			.catch(err => {
				console.error('Error opening chat:', err)
				if (isMounted) {
					navigate('/chat', { replace: true })
				}
			})

		return () => {
			isMounted = false
		}
	}, [user_id, currentUserId, token, navigate, markChatAsRead])

	const sendMessage = async () => {
		if (!newMessage.trim() || !selectedChat || !token) return

		const content = newMessage.trim()
		setNewMessage('')

		try {
			const res = await fetch('/api/messages/send', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					chat_id: selectedChat.chat_id,
					content
				})
			})

			if (!res.ok) {
				console.error('Failed to send message')
				setNewMessage(content)
			}
		} catch (err) {
			console.error('Error sending message:', err)
			setNewMessage(content)
		}
	}

	const handleSelectChat = (chat: ChatObject) => {
		markChatAsRead(chat.chat_id)
		const otherUser = getOtherUser(chat)
		if (otherUser) {
			navigate(`/chat/${otherUser.id}`)
		}
	}

	return {
		chats,
		selectedChat,
		messages,
		newMessage,
		setNewMessage,
		sendMessage,
		handleSelectChat,
		userIdParam: user_id ? parseInt(user_id, 10) : null,
	}
}
