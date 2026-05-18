import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import NotificationBell from './NotificationBell'
import './RightSidebar.css'

type Props = {
	currentUser: { id: number; username: string; avatar?: string } | null
}

function RightSidebar({ currentUser }: Props) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const [showMenu, setShowMenu] = useState(false)
	const [showLanguageMenu, setShowLanguageMenu] = useState(false)

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng)
		setShowLanguageMenu(false)
	}

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
				<div className="icon-item" onClick={() => navigate('/chat')}>
					<span className="icon">✉️</span>
				</div>

				{/* Notifications */}
				{currentUser && <NotificationBell userId={currentUser.id} />}

				{/* Language Switcher */}
				<div className="icon-item language-menu" onClick={() => setShowLanguageMenu(!showLanguageMenu)}>
					<span className="icon">🌐</span>
					
					{showLanguageMenu && (
						<div className="language-dropdown">
							<div onClick={() => changeLanguage('en')}>🇬🇧 English</div>
							<div onClick={() => changeLanguage('ru')}>🇷🇺 Русский</div>
							<div onClick={() => changeLanguage('hy')}>🇦🇲 Հայերեն</div>
						</div>
					)}
				</div>

			</div>
		</aside>
	)
}

export default RightSidebar
