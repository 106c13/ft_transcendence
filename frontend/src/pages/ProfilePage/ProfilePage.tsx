import { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useGameHistory } from '../../hooks/useGameHistory';
import type { TabType } from '../../utils/profileUtils';
import type { LayoutContextType } from '../../utils/layoutContextUtils';
import ProfileHeader from '../../components/ProfileHeader/ProfileHeader';
import ProfileTabs from '../../components/ProfileTabs/ProfileTabs';
import OngoingGameCard from '../../components/OngoingGameCard/OngoingGameCard';
import type { LiveGameData } from '../../utils/gameUtils';
import pageStyles from './ProfilePage.module.css';

type Props = {
    defaultTab?: TabType;
};

const ProfilePage = ({ defaultTab = 'overview' }: Props) => {
    const { username } = useParams();
    const { currentUser, friendSocket } = useOutletContext<LayoutContextType>();

    const {
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
    } = useProfile(friendSocket, currentUser, username, defaultTab);

    // Load game history to know total games count and pass down to tabs
    const history = useGameHistory(user?.username || '');

    // Live Ongoing Game below header
    const [activeGame, setActiveGame] = useState<LiveGameData | null>(null);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const profileUsername = user?.username;

    const fetchLiveGame = useCallback(async (resetFirst = false) => {
        if (!profileUsername) return;
        if (resetFirst) {
            setActiveGame(null);
            setIsLiveActive(false);
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/game/live/${profileUsername}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.gameId) {
                    setActiveGame(data);
                    // Double rAF ensures the 0fr collapsed state is painted before transitioning to 1fr
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setIsLiveActive(true);
                        });
                    });
                    return;
                }
            }
            // If response is not ok (no active game on server):
            // Only clear state if we don't already have an active game mounted.
            // If activeGame is already mounted, OngoingGameCard handles the 5-second countdown on game over.
            setActiveGame((prev) => {
                if (!prev) {
                    setIsLiveActive(false);
                    return null;
                }
                return prev;
            });
        } catch {
            setActiveGame((prev) => {
                if (!prev) {
                    setIsLiveActive(false);
                    return null;
                }
                return prev;
            });
        }
    }, [profileUsername]);

    useEffect(() => {
        const id = setTimeout(() => {
            fetchLiveGame(true);
        }, 0);
        return () => clearTimeout(id);
    }, [fetchLiveGame]);

    // Listen for live presence changes to automatically detect game start
    useEffect(() => {
        const handleStatusChange = (e: Event) => {
            const customEvent = e as CustomEvent<{
                userId: number;
                username: string;
                status: string;
                gameId?: string;
            }>;
            const data = customEvent.detail;
            if (!data || !profileUsername) return;

            if (data.username?.toLowerCase() === profileUsername.toLowerCase()) {
                if (data.status === 'INGAME') {
                    fetchLiveGame();
                }
            }
        };

        window.addEventListener('user_status_changed', handleStatusChange);
        return () => {
            window.removeEventListener('user_status_changed', handleStatusChange);
        };
    }, [profileUsername, fetchLiveGame]);

    const handleStartExit = useCallback(() => {
        setIsLiveActive(false);
    }, []);

    const handleDoneExit = useCallback(() => {
        setActiveGame(null);
    }, []);

    usePageTitle(user?.isOwnProfile ? 'page_title_profile' : 'page_title_user_profile', { username: user?.username || '' });

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen pb-16 box-border bg-[radial-gradient(circle_at_top,#0f172a,#020617)] text-slate-200">
                <p className="text-[15px] text-red-400">{error}</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center pt-[72px] min-[769px]:pt-[84px] px-4 min-[769px]:px-10 pb-8 min-[769px]:pb-10 w-full box-border">
            <div className={pageStyles.headerWrapper}>
                <ProfileHeader
                    user={user}
                    isOwnProfile={user.isOwnProfile || false}
                    isLoggedIn={isLoggedIn}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    friendStatus={friendStatus}
                    isLiveGame={isLiveActive}
                    activeTab={activeTab}
                    onSelectTab={handleSelectTab}
                    onSend={sendFriendRequest}
                    onAccept={acceptFriendRequest}
                    onReject={rejectFriendRequest}
                    onCancel={cancelFriendRequest}
                    onUnfriend={unFriendRequest}
                    onLogout={logout}
                    onSettings={goToSettings}
                />
            </div>

            {activeGame && (
                <div
                    className={`${pageStyles.liveGameCollapse} ${
                        isLiveActive ? pageStyles.liveGameOpen : ''
                    }`}
                >
                    <div className={pageStyles.liveGameInner}>
                        <OngoingGameCard
                            gameData={activeGame}
                            profileUsername={user.username}
                            currentUserId={currentUser?.id}
                            onGameOverStartExit={handleStartExit}
                            onGameOverDone={handleDoneExit}
                        />
                    </div>
                </div>
            )}

            <ProfileTabs
                activeTab={activeTab}
                friends={friends}
                username={user.username}
                isOwnProfile={user.isOwnProfile || false}
                ratings={user.ratings}
                historyData={history}
                onSelectTab={handleSelectTab}
                onFriendClick={goToUserProfile}
            />
        </div>
    );
};

export default ProfilePage;
