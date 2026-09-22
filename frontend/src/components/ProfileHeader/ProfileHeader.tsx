import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { User, FriendStatus } from '../../constants/profileConstants'
import styles from './ProfileHeader.module.css'

type Props = {
    user: User
    isOwnProfile: boolean
    isLoggedIn: boolean
    menuOpen: boolean
    setMenuOpen: (value: boolean) => void
    friendStatus: FriendStatus
    onSend: () => void
    onAccept: () => void
    onReject: () => void
    onCancel: () => void
    onUnfriend: () => void
    onLogout: () => void
    onSettings: () => void
}

function ProfileHeader({
    user,
    isOwnProfile,
    isLoggedIn,
    friendStatus,
    onSend,
    onAccept,
    onReject,
    onCancel,
    onUnfriend,
    onLogout,
    onSettings,
}: Props) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleMessageClick = () => {
        navigate(`/chat/${user.id}`)
    }

    return (
        <div className={styles.profileHeader}>
            <img
                className={styles.profileAvatar}
                src={
                    user.avatar && user.avatar !== 'default.jpg'
                        ? `/uploads/${user.avatar}`
                        : `/assets/default.jpg`
                }
                alt={user.username || t('avatar', 'Avatar')}
                onError={(e) => {
                    const target = e.currentTarget
                    if (!target.src.endsWith('/assets/default.jpg')) {
                        target.src = '/assets/default.jpg'
                    }
                }}
            />

            <div className={styles.profileInfo}>
                <div className={styles.topRow}>
                    <div className={styles.username}>{user.username}</div>
                    <div className={styles.flag}>🏳️</div>
                </div>

                <div className={styles.bio}>{user.bio || t('no_bio_yet', 'No bio yet')}</div>

                <div className={styles.meta}>
                    <span>
                        {t('joined', 'Joined')}:{' '}
                        {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : t('unknown', 'Unknown')}
                    </span>
                    <span className={styles.metaDot}>•</span>
                    {isOwnProfile || user.status === 'ONLINE' ? (
                        <span className={styles.onlineIndicator}>
                            <span className={styles.onlineDot}></span>
                            {t('online', 'Online')}
                        </span>
                    ) : user.status === 'INGAME' ? (
                        <span className={styles.ingameIndicator}>
                            <span className={styles.ingameDot}></span>
                            {t('in_game', 'In Game')}
                        </span>
                    ) : (
                        <span className={styles.offlineIndicator}>
                            <span className={styles.offlineDot}></span>
                            {t('offline', 'Offline')}
                        </span>
                    )}
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
                            ⚙️ {t('settings', 'Settings')}
                        </button>
                        <button
                            className={`${styles.headerBtn} ${styles.dangerBtn}`}
                            onClick={onLogout}
                        >
                            🚪 {t('logout', 'Logout')}
                        </button>
                    </>
                ) : isLoggedIn ? (
                    <>
                        {friendStatus === 'NONE' && (
                            <button
                                className={`${styles.headerBtn} ${styles.primaryBtn}`}
                                onClick={onSend}
                            >
                                + {t('send_friend_request', 'Add Friend')}
                            </button>
                        )}

                        {friendStatus === 'SENT' && (
                            <button
                                className={`${styles.headerBtn} ${styles.pendingBtn}`}
                                onClick={onCancel}
                                title={t('cancel_request', 'Cancel Request')}
                            >
                                ⏳ {t('request_sent', 'Request Sent')}
                            </button>
                        )}

                        {friendStatus === 'RECEIVED' && (
                            <>
                                <button
                                    className={`${styles.headerBtn} ${styles.successBtn}`}
                                    onClick={onAccept}
                                >
                                    ✓ {t('accept', 'Accept')}
                                </button>
                                <button
                                    className={`${styles.headerBtn} ${styles.dangerBtn}`}
                                    onClick={onReject}
                                >
                                    ✕ {t('reject', 'Reject')}
                                </button>
                            </>
                        )}

                        {friendStatus === 'ACCEPTED' && (
                            <>
                                <button
                                    className={`${styles.headerBtn} ${styles.friendsBtn}`}
                                    onClick={onUnfriend}
                                    title={t('unfriend', 'Unfriend')}
                                >
                                    ✓ {t('friends', 'Friends')}
                                </button>
                                <button
                                    className={`${styles.headerBtn} ${styles.secondaryBtn}`}
                                    onClick={handleMessageClick}
                                >
                                    💬 {t('message', 'Message')}
                                </button>
                            </>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    )
}

export default ProfileHeader