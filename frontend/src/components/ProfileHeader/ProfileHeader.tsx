import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, UserPlus, Clock, Check, X, UserCheck, MessageSquare, Calendar } from 'lucide-react';
import type { User, FriendStatus, TabType } from '../../utils/profileUtils';
import TopRankBadge from '../TopRankBadge/TopRankBadge';
import styles from './ProfileHeader.module.css';


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

    const statusClass =
        isLiveGame || user.status === 'INGAME'
            ? styles.ingame
            : isOwnProfile || user.status === 'ONLINE'
            ? styles.online
            : styles.offline;

    const statusLabel =
        isLiveGame || user.status === 'INGAME'
            ? t('in_game')
            : isOwnProfile || user.status === 'ONLINE'
            ? t('online')
            : t('offline');

    return (
        <div className={styles.profileHeader}>
            {/* Top Section: Avatar with Status Dot, Identity Info, Action Buttons */}
            <div className={styles.topSection}>
                <div className={styles.identityGroup}>
                    <div className={styles.avatarWrapper} title={statusLabel}>
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
                        <span
                            className={`${styles.statusDot} ${statusClass}`}
                            aria-label={statusLabel}
                        />
                    </div>

                    <div className={styles.profileInfo}>
                        <div className={styles.nameRow}>
                            <h2 className={styles.username}>{user.username}</h2>
                            {user.leaderboardRank ? (
                                <div
                                    className={styles.rankGroup}
                                    onClick={() => navigate('/leaderboard')}
                                    title={t('view_leaderboard')}
                                    role="button"
                                    tabIndex={0}
                                >
                                    {user.leaderboardRank <= 3 && (
                                        <TopRankBadge rank={user.leaderboardRank} size="sm" />
                                    )}
                                    <span className={styles.leaderboardRankPill}>
                                        #{user.leaderboardRank}
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        <div className={styles.joinedAt}>
                            <Calendar size={13} className={styles.joinedIcon} aria-hidden="true" />
                            <span>{t('joined')}:</span>
                            <span className={styles.joinedDate}>
                                {user.created_at
                                    ? new Date(user.created_at).toLocaleDateString()
                                    : t('unknown')}
                            </span>
                        </div>

                        <p className={styles.bio}>{user.bio || t('no_bio_yet')}</p>
                    </div>
                </div>

                {/* Header Actions */}
                <div className={styles.headerActions}>
                {isOwnProfile ? (
                    <>
                        <button
                            className={`${styles.headerBtn} ${styles.secondaryBtn}`}
                            onClick={onSettings}
                        >
                            <Settings size={15} aria-hidden="true" />
                            <span>{t('settings')}</span>
                        </button>
                        <button
                            className={`${styles.headerBtn} ${styles.dangerBtn}`}
                            onClick={onLogout}
                        >
                            <LogOut size={15} aria-hidden="true" />
                            <span>{t('logout')}</span>
                        </button>
                    </>
                ) : isLoggedIn ? (
                    <>
                        {friendStatus === 'NONE' && (
                            <button
                                className={`${styles.headerBtn} ${styles.primaryBtn}`}
                                onClick={onSend}
                            >
                                <UserPlus size={15} aria-hidden="true" />
                                <span>{t('send_friend_request')}</span>
                            </button>
                        )}

                        {friendStatus === 'SENT' && (
                            <button
                                className={`${styles.headerBtn} ${styles.pendingBtn}`}
                                onClick={onCancel}
                                title={t('cancel_request')}
                            >
                                <Clock size={15} aria-hidden="true" />
                                <span>{t('request_sent')}</span>
                            </button>
                        )}

                        {friendStatus === 'RECEIVED' && (
                            <>
                                <button
                                    className={`${styles.headerBtn} ${styles.successBtn}`}
                                    onClick={onAccept}
                                >
                                    <Check size={15} aria-hidden="true" />
                                    <span>{t('accept')}</span>
                                </button>
                                <button
                                    className={`${styles.headerBtn} ${styles.dangerBtn}`}
                                    onClick={onReject}
                                >
                                    <X size={15} aria-hidden="true" />
                                    <span>{t('reject')}</span>
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
                                    <UserCheck size={15} aria-hidden="true" />
                                    <span>{t('friends')}</span>
                                </button>
                                <button
                                    className={`${styles.headerBtn} ${styles.secondaryBtn}`}
                                    onClick={handleMessageClick}
                                >
                                    <MessageSquare size={15} aria-hidden="true" />
                                    <span>{t('message')}</span>
                                </button>
                            </>
                        )}
                    </>
                ) : null}
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
