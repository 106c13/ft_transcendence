import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../../hooks/useProfile';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useGameHistory } from '../../hooks/useGameHistory';
import type { TabType } from '../../utils/profileUtils';
import type { LayoutContextType } from '../../layouts/MainLayout';
import ProfileHeader from '../../components/ProfileHeader/ProfileHeader';
import ProfileTabs from '../../components/ProfileTabs/ProfileTabs';
import OngoingGameCard from '../../components/OngoingGameCard/OngoingGameCard';
import type { LiveGameData } from '../../utils/gameUtils';
import pageStyles from './ProfilePage.module.css';

type Props = {
    defaultTab?: TabType;
};

const ProfilePage = ({ defaultTab = 'overview' }: Props) => {
    const { t } = useTranslation();
    const { username } = useParams();
    const layoutContext = useOutletContext<LayoutContextType | undefined>();
    const currentUserId = layoutContext?.currentUser?.id ?? null;

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
    } = useProfile(username, defaultTab);

    // Load game history to know total games count and pass down to tabs
    const history = useGameHistory(user?.username || '');

    // Live Ongoing Game beside header
    const [activeGame, setActiveGame] = useState<LiveGameData | null>(null);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [headerHeight, setHeaderHeight] = useState<number | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const fetchLiveGame = useCallback(async () => {
        if (!user?.username) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/game/live/${user.username}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.gameId) {
                    setActiveGame(data);
                    // rAF ensures the element is mounted in DOM before triggering active class for smooth expansion
                    requestAnimationFrame(() => {
                        setIsLiveActive(true);
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
    }, [user?.username]);

    useEffect(() => {
        setActiveGame(null);
        setIsLiveActive(false);
        fetchLiveGame();
    }, [user?.username, fetchLiveGame]);

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
            if (!data || !user?.username) return;

            if (data.username?.toLowerCase() === user.username.toLowerCase()) {
                if (data.status === 'INGAME') {
                    fetchLiveGame();
                }
            }
        };

        window.addEventListener('user_status_changed', handleStatusChange);
        return () => {
            window.removeEventListener('user_status_changed', handleStatusChange);
        };
    }, [user?.username, fetchLiveGame]);

    // Measure header height to keep board 1:1 matching
    useEffect(() => {
        if (!headerRef.current) return;

        const updateHeight = () => {
            if (headerRef.current) {
                const h = headerRef.current.offsetHeight;
                if (h > 0) {
                    setHeaderHeight((prev) => {
                        if (prev !== null && Math.abs(prev - h) <= 2) {
                            return prev;
                        }
                        return h;
                    });
                }
            }
        };

        updateHeight();

        const ro = new ResizeObserver(() => {
            updateHeight();
        });
        ro.observe(headerRef.current);

        return () => ro.disconnect();
    }, [user, friends]);

    const handleStartExit = useCallback(() => {
        setIsLiveActive(false);
    }, []);

    const handleDoneExit = useCallback(() => {
        setActiveGame(null);
    }, []);

    usePageTitle(user?.isOwnProfile ? 'page_title_profile' : 'page_title_user_profile', { username: user?.username || '' });

    if (error) {
        return (
            <div className={pageStyles.authPage}>
                <p className={`${pageStyles.msg} ${pageStyles.error}`}>{error}</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={pageStyles.authPage}>
                <p className={pageStyles.msg}>{t('user_not_found')}</p>
            </div>
        );
    }

    return (
        <div className={pageStyles.profilePage}>
            {/* Header and Live Game placed side-by-side with fluid grid width transitions */}
            <div
                className={`${pageStyles.headerWrapper} ${
                    isLiveActive ? pageStyles.hasLiveGame : ''
                }`}
                style={
                    headerHeight
                        ? ({
                                '--header-height': `${headerHeight}px`,
                          } as React.CSSProperties)
                        : undefined
                }
            >
                <div ref={headerRef} className={pageStyles.headerContainer}>
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
                    <div className={pageStyles.liveGameContainer}>
                        <OngoingGameCard
                            gameData={activeGame}
                            profileUsername={user.username}
                            currentUserId={currentUserId}
                            size={headerHeight}
                            onGameOverStartExit={handleStartExit}
                            onGameOverDone={handleDoneExit}
                        />
                    </div>
                )}
            </div>

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
