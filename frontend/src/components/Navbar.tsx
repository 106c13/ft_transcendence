import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import NotificationBell from './NotificationBell'
import './Navbar.css'

type Props = {
	currentUser?: { id: number; username: string; avatar?: string } | null
}

function Navbar({ currentUser }: Props) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const [showProfileMenu, setShowProfileMenu] = useState(false)
	const [showLanguageMenu, setShowLanguageMenu] = useState(false)

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng)
		setShowLanguageMenu(false)
	}

	return (
		<header className="navbar">
			<div className="navbar-brand" onClick={() => navigate('/home')}>
				<h2>ft_transcendence</h2>
			</div>

			<div className="navbar-actions">
				{/* Messages */}
				<div className="nav-action-item" onClick={() => navigate('/chat')} title={t('chat', 'Chat')}>
					<span className="nav-action-icon">✉️</span>
				</div>

				{/* Notifications */}
				{currentUser && <NotificationBell userId={currentUser.id} />}

				{/* Language Switcher */}
				<div
					className="nav-action-item language-menu"
					onClick={() => {
						setShowLanguageMenu(!showLanguageMenu)
						setShowProfileMenu(false)
					}}
					title={t('language', 'Language')}
				>
					<span className="nav-action-icon">🌐</span>

					{showLanguageMenu && (
						<div className="language-dropdown">
							<div onClick={() => changeLanguage('en')}>🇬🇧 English</div>
							<div onClick={() => changeLanguage('ru')}>🇷🇺 Русский</div>
							<div onClick={() => changeLanguage('hy')}>🇦🇲 Հայերեն</div>
						</div>
					)}
				</div>

				{/* Profile Dropdown */}
				<div
					className="nav-action-item profile-menu"
					onClick={() => {
						setShowProfileMenu(!showProfileMenu)
						setShowLanguageMenu(false)
					}}
				>
					<img
						src={currentUser?.avatar ? `/uploads/${currentUser.avatar}` : '/assets/default.jpg'}
						alt="profile"
						className="nav-profile-avatar"
					/>

					{showProfileMenu && (
						<div className="profile-dropdown">
							<div onClick={() => navigate(`/profile/${currentUser?.username || ''}`)}>
								👤 {t('my_profile', 'My Profile')}
							</div>
							<div onClick={() => navigate('/profile/settings')}>
								⚙️ {t('settings', 'Settings')}
							</div>
							<div
								className="danger"
								onClick={() => {
									localStorage.removeItem('token')
									navigate('/login')
								}}
							>
								🚪 {t('logout', 'Logout')}
							</div>
						</div>
					)}
				</div>
			</div>
		</header>
	)
}

export default Navbar
