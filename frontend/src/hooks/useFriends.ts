import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useToast } from '../context/ToastContext';
import type { User } from '../utils/profileUtils';

export function useFriends(currentUser: User | null) {
    const { toast } = useToast();
    const [friends, setFriends] = useState<User[]>([]);
    const socketRef = useRef<Socket | null>(null);

	const loadFriends = useCallback(async () => {
		if (!currentUser) return
		try {
			const token = localStorage.getItem('token')
			if (!token) return

			const res = await fetch(`/api/friends/list/${currentUser.username}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (!res.ok) return
			const data = await res.json()
			setFriends(data)
		} catch (err) {
			console.error(err)
		}
	}, [currentUser]);

    // Listen to real-time friend status updates
    useEffect(() => {
        const handleStatusChange = (e: Event) => {
            const customEvent = e as CustomEvent<{
                userId: number;
                username: string;
                status: string
            }>;
            const data = customEvent.detail;
            if (!data) return;

            setFriends(prev =>
                prev.map(friend => {
                    if (friend.id === data.userId || friend.username?.toLowerCase() === data.username?.toLowerCase()) {
                        return { ...friend, status: data.status };
                    }
                    return friend;
                })
            );
        }

        window.addEventListener('user_status_changed', handleStatusChange);
        return () => {
            window.removeEventListener('user_status_changed', handleStatusChange);
        }
    }, []);

    useEffect(() => {
        loadFriends();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        const socket = io('/friends', {
            query: { userId: currentUser.id.toString() },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {});

        socket.on('friend_request_sent', () => {
            loadFriends();
        });

        socket.on('friend_request_accepted', () => {
            loadFriends();
        });

        socket.on('friend_request_rejected', () => {
            loadFriends();
        });

        socket.on('unfriended', () => {
            loadFriends();
        });

        socket.on('friend_request_error', (data: { message: string }) => {
            toast.error(data.message);
        });

        socket.on('friend_request_received', () => {
            loadFriends();
        });

        socket.on('unfriend_error', (data: { message: string }) => {
            toast.error(data.message);
        });

        socket.on('friend_request_cancelled', () => {
            loadFriends();
        });

        socket.on('profile_friends_updated', (data: { username: string }) => {
            window.dispatchEvent(new CustomEvent('profile_friends_updated', { detail: data }));
        });

        return () => {
            socket.disconnect();
        };
    }, [currentUser]);

    const sendFriendRequest = useCallback((friendUsername: string) => {
        if (socketRef.current) {
            socketRef.current.emit('send_friend_request', { friendUsername });
        }
    }, []);

    const acceptFriendRequest = useCallback((friendUsername: string) => {
        if (socketRef.current) {
            socketRef.current.emit('accept_friend_request', { friendUsername });
        }
    }, []);

    const rejectFriendRequest = useCallback((friendUsername: string) => {
        if (socketRef.current) {
            socketRef.current.emit('reject_friend_request', { friendUsername });
        }
    }, []);

    const cancelFriendRequest = useCallback((friendUsername: string) => {
        if (socketRef.current) {
            socketRef.current.emit('cancel_friend_request', { friendUsername });
        }
    }, []);

    const unfriend = useCallback((friendUsername: string) => {
        if (socketRef.current) {
            socketRef.current.emit('unfriend', { friendUsername });
        }
    }, []);

    const viewProfile = useCallback((username: string) => {
        if (socketRef.current && username) {
            socketRef.current.emit('view_profile', { username });
        }
    }, []);

    const leaveProfile = useCallback((username: string) => {
        if (socketRef.current && username) {
            socketRef.current.emit('leave_profile', { username });
        }
    }, []);

    return {
        friends,
        loadFriends,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        cancelFriendRequest,
        unfriend,
        viewProfile,
        leaveProfile,
    };
}