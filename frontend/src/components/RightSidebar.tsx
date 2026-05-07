// frontend/src/components/RightSidebar.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import './RightSidebar.css'

type Props = {
	currentUser: { id: number; username: string; avatar?: string } | null
}

function RightSidebar({ currentUser }: Props) {
	const navigate = useNavigate()
	const [showMenu, setShowMenu] = useState(false)

	return (
		<aside className="right-sidebar">
			<div className="right-sidebar-icons">
				{/* Profile Menu */}
				<div className="icon-item profile-menu" onClick={() => setShowMenu(!showMenu)}>
					<img 
						src={currentUser?.avatar ? `/uploads/${currentUser.avatar}` : '/assets/default.jpg'}
						alt="profile"
						className="profile-icon"
					/>
					
					{showMenu && (
						<div className="profile-dropdown">
							<div onClick={() => navigate(`/profile/${currentUser?.username}`)}>
								👤 My Profile
							</div>
							<div onClick={() => navigate('/profile/settings')}>
								⚙️ Settings
							</div>
							<div 
								className="danger"
								onClick={() => {
									localStorage.removeItem('token')
									navigate('/login')
								}}
							>
								🚪 Logout
							</div>
						</div>
					)}
				</div>

				{/* Messages */}
				<div className="icon-item" onClick={() => navigate('/messages')}>
					<span className="icon">💬</span>
				</div>

				{/* Notifications */}
				{currentUser && <NotificationBell userId={currentUser.id} />}
			</div>
		</aside>
	)
}

export default RightSidebar
