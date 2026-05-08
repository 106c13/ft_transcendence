import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import NotificationBell from './NotificationBell'
import './RightSidebar.css'

type Props = {
	currentUser: { id: number; username: string; avatar?: string } | null
}

function RightSidebar({ currentUser }: Props) {
	const { t } = useTranslation()
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
								👤 {t('my_profile')}
							</div>
							<div onClick={() => navigate('/profile/settings')}>
								⚙️ {t('settings')}
							</div>
							<div 
								className="danger"
								onClick={() => {
									localStorage.removeItem('token')
									navigate('/login')
								}}
							>
								🚪 {t('logout')}
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
