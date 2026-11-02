import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import type { TabType, User, FriendStatus } from '../utils/profileUtils';
import type { FriendSocketType } from '../utils/layoutContextUtils';

export function useProfile(
	friendSocket: FriendSocketType,
	currentUser: User | null,
	username?: string,
	defaultTab: TabType = 'overview'
) {
	const { t } = useTranslation();
	const { toast } = useToast();
	const location = useLocation();
	const initialTab: TabType = (location.state as any)?.defaultTab || defaultTab;
	const [user, setUser] = useState<User | null>(null);
	const [error] = useState('');
	const [menuOpen, setMenuOpen] = useState(false);
	const [friendStatus, setFriendStatus] = useState<FriendStatus>('NONE');
	const [activeTab, setActiveTab] = useState<TabType>(initialTab);
	const [friends, setFriends] = useState<User[]>([]);
	const isLoggedIn = !!localStorage.getItem('token');

	const navigate = useNavigate();

	useEffect(() => {
		const stateTab = (location.state as any)?.defaultTab;
		if (stateTab) {
			setActiveTab(stateTab);
		} else if (defaultTab) {
			setActiveTab(defaultTab);
		}
	}, [location.state, defaultTab]);

	const loadFriendStatus = useCallback(async (token: string, targetUsername: string) => {
		try {
			const res = await fetch(`/api/friends/status/${targetUsername}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return;
			const data = await res.json();
			setFriendStatus((data?.status?.toUpperCase() as FriendStatus) || 'NONE');
		} catch {
			setFriendStatus('NONE');
		}
	}, []);

	const loadFriends = useCallback(async () => {
		if (!user?.username) return;
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			const res = await fetch(`/api/friends/list/${user.username}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return;
			const data = await res.json();
			setFriends(data);
		} catch (err) {
			console.error(err);
		}
	}, [user?.username]);

	useEffect(() => {
		let isMounted = true;

		const loadProfile = async () => {
			if (!username) {
				if (currentUser && isMounted) {
					setUser({
						...currentUser,
						isOwnProfile: true,
					});
				}
				return;
			}

			try {
				const token = localStorage.getItem('token');
				const headers: HeadersInit = {};

				if (token) {
					headers.Authorization = `Bearer ${token}`;
				}

				const res = await fetch(`/api/users/${encodeURIComponent(username)}`, { headers });
				const data = res.ok ? await res.json() : null;

				if (!isMounted) return;

				if (!data?.id) {
					setUser(null);
					toast.error(t('user_not_found'), { id: 'user_not_found' });
					navigate('/home', { replace: true });
					return;
				}

				setUser({
					...data,
					isOwnProfile: data.isOwnProfile ?? false,
				});

				if (token && username && data.isOwnProfile === false) {
					loadFriendStatus(token, username);
				}
			} catch {
				if (!isMounted) return;
				toast.error(t('user_not_found'), { id: 'user_not_found' });
				navigate('/home', { replace: true });
			}
		};

		loadProfile();

		return () => {
			isMounted = false;
		};
	}, [username, currentUser, loadFriendStatus, navigate, t, toast]);

	useEffect(() => {
		if (user?.username) {
			loadFriends();
		}
	}, [user?.username, loadFriends]);

	// Join profile room for live friend list synchronization
	useEffect(() => {
		if (!user?.username) return;

		const targetUsername = user.username;
		friendSocket.viewProfile(targetUsername);

		const handleProfileFriendsUpdated = (e: Event) => {
			const customEvent = e as CustomEvent<{ username: string }>;
			const updatedUsername = customEvent.detail?.username;
			if (updatedUsername && updatedUsername.toLowerCase() === targetUsername.toLowerCase()) {
				loadFriends();
				const token = localStorage.getItem('token');
				if (token && user.isOwnProfile === false) {
					loadFriendStatus(token, targetUsername);
				}
			}
		};

		window.addEventListener('profile_friends_updated', handleProfileFriendsUpdated);

		return () => {
			friendSocket.leaveProfile(targetUsername);
			window.removeEventListener('profile_friends_updated', handleProfileFriendsUpdated);
		};
	}, [user?.username, user?.isOwnProfile, friendSocket, loadFriends, loadFriendStatus]);

	useEffect(() => {
		const handleStatusChange = (e: Event) => {
			const customEvent = e as CustomEvent<{ userId: number; username: string; status: string }>;
			const data = customEvent.detail;
			if (!data) return;

			setUser(prev => {
				if (!prev) return null;
				if (prev.id === data.userId || prev.username?.toLowerCase() === data.username?.toLowerCase()) {
					return { ...prev, status: data.status };
				}
				return prev;
			});

			setFriends(prev =>
				prev.map(friend => {
					if (friend.id === data.userId || friend.username?.toLowerCase() === data.username?.toLowerCase()) {
						return { ...friend, status: data.status };
					}
					return friend;
				})
			);
		};

		window.addEventListener('user_status_changed', handleStatusChange);
		return () => {
			window.removeEventListener('user_status_changed', handleStatusChange);
		};
	}, []);

	const handleSelectTab = (tab: TabType) => {
		setActiveTab(tab);
		if (tab === 'friends') {
			loadFriends();
		}
	};

	const sendFriendRequest = () => {
		if (!user) return;
		friendSocket.sendFriendRequest(user.username);
		setFriendStatus('SENT');
	};

	const acceptFriendRequest = () => {
		if (!user) return;
		friendSocket.acceptFriendRequest(user.username);
		setFriendStatus('ACCEPTED');
		loadFriends();
	};

	const rejectFriendRequest = () => {
		if (!user) return;
		friendSocket.rejectFriendRequest(user.username);
		setFriendStatus('NONE');
	};

	const cancelFriendRequest = () => {
		if (!user) return;
		friendSocket.cancelFriendRequest(user.username);
		setFriendStatus('NONE');
	};
	
	const unFriendRequest = () => {
		if (!user) return;
		friendSocket.unfriend(user.username);
		setFriendStatus('NONE');
		loadFriends();
	};

	const logout = () => {
		localStorage.removeItem('token');
		navigate('/login');
	};

	const goToSettings = () => navigate('/profile/settings');
	const goToUserProfile = (targetUsername: string) => navigate(`/profile/${targetUsername}`);

	return {
		user,
		error,
		friends,
		friendStatus,
		activeTab,
		isLoggedIn,
		menuOpen,
		setMenuOpen,
		handleSelectTab,
		sendFriendRequest,
		acceptFriendRequest,
		rejectFriendRequest,
		cancelFriendRequest,
		unFriendRequest,
		logout,
		goToSettings,
		goToUserProfile,
	};
}
