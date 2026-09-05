import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../../hooks/useProfile'
import ProfileHeader from '../../components/ProfileHeader/ProfileHeader'
import ProfileTabs from '../../components/ProfileTabs/ProfileTabs'
import styles from '../Common.module.css'

function ProfilePage() {
    const { t } = useTranslation()
    const { username } = useParams()

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
    } = useProfile(username)

    if (error) {
        return (
            <div className={styles.authPage}>
                <p className={`${styles.msg} ${styles.error}`}>{error}</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className={styles.authPage}>
                <p className={styles.msg}>{t('user_not_found')}</p>
            </div>
        )
    }

    return (
        <div className={styles.profilePage}>
            <ProfileHeader
                user={user}
                isOwnProfile={user.isOwnProfile || false}
                isLoggedIn={isLoggedIn}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                friendStatus={friendStatus}
                onSend={sendFriendRequest}
                onAccept={acceptFriendRequest}
                onReject={rejectFriendRequest}
                onCancel={cancelFriendRequest}
                onUnfriend={unFriendRequest}
                onLogout={logout}
                onSettings={goToSettings}
            />

            <ProfileTabs
                activeTab={activeTab}
                friends={friends}
                username={user.username}
                onSelectTab={handleSelectTab}
                onFriendClick={goToUserProfile}
            />
        </div>
    )
}

export default ProfilePage
