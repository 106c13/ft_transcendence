import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

type NewMessageEvent = {
	type: string;
	message?: {
		sender_id?: number;
		chat_id?: string;
	};
};

type MessagesReadEvent = {
	chat_id?: string;
	reader_id?: number;
	unread_count?: number;
};

export function useUnreadMessages(userId: number | undefined) {
	const [unreadCount, setUnreadCount] = useState(0);

	const fetchUnreadCount = useCallback(async () => {
		if (!userId) return;
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const res = await fetch('/api/messages/unread/total', {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setUnreadCount(data.count ?? 0);
			}
		} catch {
			// Ignore transient background fetch errors
		}
	}, [userId]);

	// Initial load on mount or user change
	useEffect(() => {
		if (!userId) return;
		const timer = setTimeout(() => {
			void fetchUnreadCount();
		}, 0);
		return () => clearTimeout(timer);
	}, [userId, fetchUnreadCount]);

	// WebSocket real-time updates and local fallback sync
	useEffect(() => {
		if (!userId) return;

		const socket = io('/chat', {
			query: { userId: userId.toString() },
			transports: ['websocket', 'polling'],
		});

		socket.on('new_message', (data: NewMessageEvent) => {
			const senderId = data?.message?.sender_id;
			if (!senderId || senderId === userId) return;
			if (window.location.pathname === `/chat/${senderId}`) return;
			setUnreadCount((prev) => prev + 1);
		});

		socket.on('messages_read', (data: MessagesReadEvent) => {
			if (data?.reader_id === userId) {
				if (typeof data.unread_count === 'number') {
					setUnreadCount(data.unread_count);
				} else {
					void fetchUnreadCount();
				}
			}
		});

		const handleLocalMessagesRead = () => {
			void fetchUnreadCount();
		};

		window.addEventListener('messages_read', handleLocalMessagesRead);

		return () => {
			socket.disconnect();
			window.removeEventListener('messages_read', handleLocalMessagesRead);
		};
	}, [userId, fetchUnreadCount]);

	return {
		unreadCount,
		fetchUnreadCount,
	};
}
