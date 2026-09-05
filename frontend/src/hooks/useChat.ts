import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import io, { Socket } from 'socket.io-client'
import type { ChatObject } from '../components/ChatSidebar/ChatSidebar'
import type { Message } from '../components/ChatMain/ChatMain'

export function useChat(currentUserId: number | null) {
	const navigate = useNavigate()
	const { user_id } = useParams()
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

	// Socket connection
	useEffect(() => {
		if (!currentUserId) return

		const socket = io('http://localhost:8080/chat', {
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
	}, [currentUserId])

	// Load chat list
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

	// Open chat from URL param (/chat/:user_id)
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

	// Load messages when chat is selected from sidebar
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

	const getOtherUser = (chat: ChatObject) => {
		if (!currentUserId) return null
		return chat.user1_id === currentUserId ? chat.user2 : chat.user1
	}

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

	const handleSelectChat = (chat: ChatObject) => {
		setSelectedChat(chat)
		if (user_id) {
			navigate('/chat', { replace: true })
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
	}
}
