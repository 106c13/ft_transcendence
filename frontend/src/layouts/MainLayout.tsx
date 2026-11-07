import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import ChallengeNotification from '../components/ChallengeNotification/ChallengeNotification';
import { useChallengeSocket } from '../hooks/useChallengeSocket';
import { useToast } from '../context/ToastContext';

import type { User } from '../utils/profileUtils';
import type { LayoutContextType } from '../utils/layoutContextUtils';
import { useFriends } from '../hooks/useFriends';
export type { User, LayoutContextType };

const MainLayout = () => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const navigate = useNavigate();
	const location = useLocation();
	const token = localStorage.getItem('token');
	const publicPaths = ['/about', '/privacy', '/terms', '/privacy-policy', '/terms-of-service'];
	const isPublicRoute = publicPaths.includes(location.pathname);

	useEffect(() => {
		if (!token) {
			if (!isPublicRoute) {
				navigate('/login', { replace: true });
			}
			return;
		}

		let isMounted = true;

		const verifyUser = async () => {
			try {
				const res = await fetch('/api/users/me', {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) throw new Error('Unauthorized');

				const data = await res.json();
				if (!data?.id) throw new Error('Unauthorized');

				if (isMounted) {
					setCurrentUser(data);
				}
			} catch {
				localStorage.removeItem('token');
				if (isMounted && !isPublicRoute) {
					navigate('/login', { replace: true });
				}
			}
		};

		verifyUser();

		return () => {
			isMounted = false;
		};
	}, [navigate, token, isPublicRoute]);

	const challengeSocket = useChallengeSocket(currentUser?.id);
	const { incomingChallenge, acceptChallenge, declineChallenge } = challengeSocket;
	const { setTopSlot } = useToast();

	const friendSocket = useFriends(currentUser);

	useEffect(() => {
		if (incomingChallenge) {
			setTopSlot(
				<ChallengeNotification
					key={incomingChallenge.challengeId}
					challenge={incomingChallenge}
					onAccept={acceptChallenge}
					onDecline={declineChallenge}
				/>
			);
		} else {
			setTopSlot(null);
		}
	}, [incomingChallenge, acceptChallenge, declineChallenge, setTopSlot]);

	// Clear topSlot on unmount of MainLayout
	useEffect(() => {
		return () => {
			setTopSlot(null);
		};
	}, [setTopSlot]);

	if (!currentUser && !isPublicRoute) {
		return null;
	}

	const isChatRoute = location.pathname.startsWith('/chat');
	const isGameRoute = location.pathname.startsWith('/game');
	const isAnalyzeRoute = location.pathname.startsWith('/analysis');
	const showFooter = !isChatRoute && !isGameRoute && !isAnalyzeRoute;

	return (
		<div className="app-layout min-h-screen flex flex-col bg-slate-900 text-slate-100">
			<Navbar currentUser={currentUser} friendSocket={friendSocket} />
			<main className="layout-body flex-1 flex flex-col w-full">
				{/* Child routes render here */}
				<Outlet context={{ currentUser, setCurrentUser, challengeSocket, friendSocket } satisfies LayoutContextType} />
			</main>
			{showFooter && <Footer currentUser={currentUser} />}
		</div>
	);
};

export default MainLayout;