import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import io, { Socket } from 'socket.io-client'
import type { ChatObject, Message } from '../utils/chatUtils';

export function useChat(currentUserId: number | null) {
	const navigate = useNavigate()
	const { userid } = useParams<{ userid?: string }>()
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

		socket.on('connect', () => {})

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

		socket.on('disconnect', () => {})

		return () => {
			socket.disconnect()
		}
	}, [currentUserId, refreshChats, markChatAsRead])

	// Sync active chat and messages with URL param (/chat/:userid)
	useEffect(() => {
		if (!currentUserId) return;

		// When on /chat without userid, clear selected chat
		if (!userid) {
			setSelectedChat(null);
			setMessages([]);
			return;
		}

		const targetUserId = parseInt(userid, 10);
		if (!/^\d+$/.test(userid) || isNaN(targetUserId) || targetUserId <= 0 || targetUserId === currentUserId) {
			setSelectedChat(null);
			setMessages([]);
			navigate('/chat', { replace: true });
			return;
		}

		let isMounted = true;

		// Optimistically select chat if it exists in current chats list
		const existingChat = chats.find(
			c => c.user1_id === targetUserId || c.user2_id === targetUserId
		);
		if (existingChat) {
			setSelectedChat(existingChat);
			markChatAsRead(existingChat.chat_id);
		}

		const openChat = async () => {
			try {
				const res = await fetch(`/api/chat/get/${userid}`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!isMounted) return;

				if (!res.ok) {
					setSelectedChat(null);
					setMessages([]);
					navigate('/chat', { replace: true });
					return;
				}

				const chat = await res.json();
				if (!isMounted) return;

				setSelectedChat(chat);
				markChatAsRead(chat.chat_id);

				setChats(prev => {
					if (prev.some(c => c.chat_id === chat.chat_id)) {
						return prev.map(c => (c.chat_id === chat.chat_id ? { ...chat, unreadCount: 0 } : c));
					}
					return [{ ...chat, unreadCount: 0 }, ...prev];
				});

				const msgRes = await fetch(`/api/messages/${chat.chat_id}?limit=100`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!isMounted || !msgRes.ok) return;

				const data = await msgRes.json();
				if (!isMounted || !data) return;

				setMessages(data.messages || []);
				if (selectedChatRef.current?.chat_id) {
					markChatAsRead(selectedChatRef.current.chat_id);
				}
			} catch {
				if (isMounted) {
					setSelectedChat(null);
					setMessages([]);
					navigate('/chat', { replace: true });
				}
			}
		};

		openChat();

		return () => {
			isMounted = false;
		};
	}, [userid, currentUserId, token, navigate, markChatAsRead]);

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
		userIdParam: userid ? parseInt(userid, 10) : null,
	}
}
