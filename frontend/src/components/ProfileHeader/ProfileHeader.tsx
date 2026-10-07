import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { User, FriendStatus, TabType } from '../../utils/profileUtils'
import TopRankBadge from '../TopRankBadge/TopRankBadge'
import styles from './ProfileHeader.module.css'

type Props = {
    user: User
    isOwnProfile: boolean
    isLoggedIn: boolean
    menuOpen: boolean
    setMenuOpen: (value: boolean) => void
    friendStatus: FriendStatus
    isLiveGame?: boolean
    activeTab?: TabType
    onSelectTab?: (tab: TabType) => void
    onSend: () => void
    onAccept: () => void
    onReject: () => void
    onCancel: () => void
    onUnfriend: () => void
    onLogout: () => void
    onSettings: () => void
}

const ProfileHeader = ({
    user,
    isOwnProfile,
    isLoggedIn,
    friendStatus,
    isLiveGame = false,
    activeTab = 'overview',
    onSelectTab,
    onSend,
    onAccept,
    onReject,
    onCancel,
    onUnfriend,
    onLogout,
    onSettings,
}: Props) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleMessageClick = () => {
        navigate(`/chat/${user.id}`)
    }

    return (
        <div className={styles.profileHeader}>
            {/* Top Section: Avatar, Nickname & Status, Bio, Action Buttons */}
            <div className={styles.topSection}>
                <div className={styles.identityGroup}>
                    <img
                        className={styles.profileAvatar}
                        src={
                            user.avatar && user.avatar !== 'default.jpg'
                                ? `/uploads/${user.avatar}`
                                : `/assets/default.jpg`
                        }
                        alt={user.username || t('avatar')}
                        onError={(e) => {
                            const target = e.currentTarget
                            if (!target.src.endsWith('/assets/default.jpg')) {
                                target.src = '/assets/default.jpg'
                            }
                        }}
                    />

                    <div className={styles.profileInfo}>
                        <h2 className={styles.username}>{user.username}</h2>
                        <div className={styles.statusRow}>
                            {isLiveGame || user.status === 'INGAME' ? (
                                <span className={styles.ingameIndicator}>
                                    <span className={styles.ingameDot}></span>
                                    {t('in_game')}
                                </span>
                            ) : isOwnProfile || user.status === 'ONLINE' ? (
                                <span className={styles.onlineIndicator}>
                                    <span className={styles.onlineDot}></span>
                                    {t('online')}
                                </span>
                            ) : (
                                <span className={styles.offlineIndicator}>
                                    <span className={styles.offlineDot}></span>
                                    {t('offline')}
                                </span>
                            )}
                        </div>

                        <div
                            className={styles.leaderboardRow}
                            onClick={() => navigate('/leaderboard')}
                            title={t('view_leaderboard')}
                            role="button"
                            tabIndex={0}
                        >
                            <span className={styles.leaderboardRatingValue}>
                                {user.leaderboardRating ?? 800}
                            </span>
                            {user.leaderboardRank !== undefined && user.leaderboardRank !== null && user.leaderboardRank <= 3 && (
                                <TopRankBadge rank={user.leaderboardRank} size="sm" />
                            )}
                            {user.leaderboardRank ? (
                                <span className={styles.leaderboardRankPill}>
                                    #{user.leaderboardRank}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Header Actions - Unified Style and Proportional Spacing */}
                <div className={styles.headerActions}>
                {isOwnProfile ? (
                    <>
                        <button
                            className={`${styles.headerBtn} ${styles.secondaryBtn}`}
                            onClick={onSettings}
                        >
                            ⚙️ {t('settings')}
                        </button>
                        <button
                            className={`${styles.headerBtn} ${styles.dangerBtn}`}
                            onClick={onLogout}
                        >
                            🚪 {t('logout')}
                        </button>
                    </>
                ) : isLoggedIn ? (
                    <>
                        {friendStatus === 'NONE' && (
                            <button
                                className={`${styles.headerBtn} ${styles.primaryBtn}`}
                                onClick={onSend}
                            >
                                + {t('send_friend_request')}
                            </button>
                        )}

                        {friendStatus === 'SENT' && (
                            <button
                                className={`${styles.headerBtn} ${styles.pendingBtn}`}
                                onClick={onCancel}
                                title={t('cancel_request')}
                            >
                                ⏳ {t('request_sent')}
                            </button>
                        )}

                        {friendStatus === 'RECEIVED' && (
                            <>
                                <button
                                    className={`${styles.headerBtn} ${styles.successBtn}`}
                                    onClick={onAccept}
                                >
                                    ✓ {t('accept')}
                                </button>
                                <button
                                    className={`${styles.headerBtn} ${styles.dangerBtn}`}
                                    onClick={onReject}
                                >
                                    ✕ {t('reject')}
                                </button>
                            </>
                        )}

                        {friendStatus === 'ACCEPTED' && (
                            <>
                                <button
                                    className={`${styles.headerBtn} ${styles.friendsBtn}`}
                                    onClick={onUnfriend}
                                    title={t('unfriend')}
                                >
                                    ✓ {t('friends')}
                                </button>
                                <button
                                    className={`${styles.headerBtn} ${styles.secondaryBtn}`}
                                    onClick={handleMessageClick}
                                >
                                    💬 {t('message')}
                                </button>
                            </>
                        )}
                    </>
                ) : null}
                </div>
            </div>

            {/* Bio Section */}
            <div className={styles.bioSection}>
                <p className={styles.bio}>{user.bio || t('no_bio_yet')}</p>
            </div>

            {/* Meta Row: Joined Date */}
            <div className={styles.metaRow}>
                <div className={styles.joinedAt}>
                    <span>{t('joined')}: </span>
                    <span className={styles.joinedDate}>
                        {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : t('unknown')}
                    </span>
                </div>
            </div>

            {/* Connected Tabs Header inside Profile Header Card */}
            <div className={styles.tabsHeader} role="tablist">
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                    onClick={() => onSelectTab?.('overview')}
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                    type="button"
                >
                    {t('overview')}
                </button>

                <button
                    className={`${styles.tab} ${activeTab === 'games' ? styles.activeTab : ''}`}
                    onClick={() => onSelectTab?.('games')}
                    role="tab"
                    aria-selected={activeTab === 'games'}
                    type="button"
                >
                    {t('games')}
                </button>

                <button
                    className={`${styles.tab} ${activeTab === 'friends' ? styles.activeTab : ''}`}
                    onClick={() => onSelectTab?.('friends')}
                    role="tab"
                    aria-selected={activeTab === 'friends'}
                    type="button"
                >
                    {t('friends')}
                </button>
            </div>
        </div>
    );
};

export default ProfileHeader;