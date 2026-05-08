import { useTranslation } from 'react-i18next'
import type { User, FriendStatus } from '../../pages/Profile'

type Props = {
	user: User
	isOwnProfile: boolean
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

	return (
		<div className="profile-header">
			{isOwnProfile && (
				<div className="profile-actions">
					<div
						className="menu-btn"
						onClick={() => setMenuOpen(!menuOpen)}
					>
						⋯
					</div>

					<div className={`menu-dropdown ${menuOpen ? 'open' : ''}`}>
						<div onClick={onSettings}>⚙️ {t('settings')}</div>
						<div onClick={onLogout} className="danger">
							🚪 {t('logout')}
						</div>
					</div>
				</div>
			)}

			<img
				className="profile-avatar"
				src={
					user.avatar
						? `/uploads/${user.avatar}`
						: `/assets/default.jpg`
				}
				alt="avatar"
			/>

			<div className="profile-info">
				<div className="top-row">
					<div className="username">{user.username}</div>
					<div className="flag">🏳️</div>
				</div>

				<div className="bio">{user.bio || t('no_bio_yet')}</div>

				<div className="meta">
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

			{!isOwnProfile && (
				<div className="header-actions">
					{friendStatus === 'NONE' && (
						<button
							className="add-friend-btn"
							onClick={onSend}
						>
							+ {t('send_friend_request')}
						</button>
					)}

					{friendStatus === 'SENT' && (
						<button
							className="pending-btn"
							onClick={onCancel}
						>
							{t('request_sent')}
						</button>
					)}

					{friendStatus === 'RECEIVED' && (
						<>
							<button
								className="accept-btn"
								onClick={onAccept}
							>
								{t('accept')}
							</button>

							<button
								className="reject-btn"
								onClick={onReject}
							>
								{t('reject')}
							</button>
						</>
					)}

					{friendStatus === 'ACCEPTED' && (
						<button
							className="friends-btn"
							onClick={onUnfriend}
						>
							{t('friends')} ✓
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export default ProfileHeader
