import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { User, FriendStatus } from '../../pages/Profile'
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
    menuOpen,
    setMenuOpen,
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
            {isOwnProfile && (
                <div className={styles.profileActions}>
                    <div
                        className={styles.menuBtn}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        ⋯
                    </div>

                    <div className={`${styles.menuDropdown} ${menuOpen ? styles.open : ''}`}>
                        <div onClick={onSettings}>⚙️ {t('settings')}</div>
                        <div onClick={onLogout} className={styles.danger}>
                            🚪 {t('logout')}
                        </div>
                    </div>
                </div>
            )}

            <img
                className={styles.profileAvatar}
                src={
                    user.avatar
                        ? `/uploads/${user.avatar}`
                        : `/assets/default.jpg`
                }
                alt="avatar"
            />

            <div className={styles.profileInfo}>
                <div className={styles.topRow}>
                    <div className={styles.username}>{user.username}</div>
                    <div className={styles.flag}>🏳️</div>
                </div>

                <div className={styles.bio}>{user.bio || t('no_bio_yet')}</div>

                <div className={styles.meta}>
                    <span>
                        {t('joined')}:{' '}
                        {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : t('unknown')}
                    </span>
                    <span>• {t('friends_count')}: 0</span>
                    <span>• {t('online')}</span>
                </div>
            </div>

            {!isOwnProfile && isLoggedIn && (
                <div className={styles.headerActions}>
                    {friendStatus === 'NONE' && (
                        <button
                            className={styles.addFriendBtn}
                            onClick={onSend}
                        >
                            + {t('send_friend_request')}
                        </button>
                    )}

                    {friendStatus === 'SENT' && (
                        <button
                            className={styles.pendingBtn}
                            onClick={onCancel}
                        >
                            {t('request_sent')}
                        </button>
                    )}

                    {friendStatus === 'RECEIVED' && (
                        <>
                            <button
                                className={styles.acceptBtn}
                                onClick={onAccept}
                            >
                                {t('accept')}
                            </button>

                            <button
                                className={styles.rejectBtn}
                                onClick={onReject}
                            >
                                {t('reject')}
                            </button>
                        </>
                    )}

                    {friendStatus === 'ACCEPTED' && (
                        <button
                            className={styles.friendsBtn}
                            onClick={onUnfriend}
                        >
                            {t('friends')} ✓
                        </button>
                    )}

                    {friendStatus == 'ACCEPTED' && (
                        <button
                            className={styles.messageBtn}
                            onClick={handleMessageClick}
                        >
                            💬 {t('message')}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default ProfileHeader