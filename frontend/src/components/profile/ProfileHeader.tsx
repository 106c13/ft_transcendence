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
						<div onClick={onSettings}>⚙️ Settings</div>
						<div onClick={onLogout} className="danger">
							🚪 Logout
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

				<div className="bio">{user.bio || 'No bio yet'}</div>

				<div className="meta">
					<span>
						Joined:{' '}
						{user.created_at
							? new Date(user.created_at).toLocaleDateString()
							: 'unknown'}
					</span>
					<span>• Friends: 0</span>
					<span>• Online</span>
				</div>
			</div>

			{!isOwnProfile && (
				<div className="header-actions">
					{friendStatus === 'NONE' && (
						<button
							className="add-friend-btn"
							onClick={onSend}
						>
							+ Add Friend
						</button>
					)}

					{friendStatus === 'SENT' && (
						<button
							className="pending-btn"
							onClick={onCancel}
						>
							Request Sent
						</button>
					)}

					{friendStatus === 'RECEIVED' && (
						<>
							<button
								className="accept-btn"
								onClick={onAccept}
							>
								Accept
							</button>

							<button
								className="reject-btn"
								onClick={onReject}
							>
								Reject
							</button>
						</>
					)}

					{friendStatus === 'ACCEPTED' && (
						<button
							className="friends-btn"
							onClick={onUnfriend}
						>
							Friends ✓
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export default ProfileHeader
