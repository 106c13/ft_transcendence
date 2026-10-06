import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MessagesIcon from '../MessagesIcon/MessagesIcon'
import NotificationBell from '../NotificationBell/NotificationBell'
import PlayerSearch from '../PlayerSearch/PlayerSearch'
import styles from './Navbar.module.css'

type Props = {
	currentUser?: { id: number; username: string; avatar?: string } | null
}

function Navbar({ currentUser }: Props) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const location = useLocation()
	const [showProfileMenu, setShowProfileMenu] = useState(false)
	const [showLanguageMenu, setShowLanguageMenu] = useState(false)
	const languageMenuRef = useRef<HTMLDivElement>(null)
	const profileMenuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node
			if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
				setShowLanguageMenu(false)
			}
			if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
				setShowProfileMenu(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng)
		setShowLanguageMenu(false)
	}

	const isAboutActive = location.pathname === '/about'

	return (
		<header className={styles.navbar}>
			<div className={styles.navbarBrand} onClick={() => navigate(currentUser ? '/home' : '/login')}>
				<h2>ft_transcendence</h2>
			</div>

			<div className={styles.navbarActions}>
				{/* Player Search */}
				{currentUser && <PlayerSearch />}

				{/* Messages */}
				{currentUser && <MessagesIcon userId={currentUser.id} />}

				{/* Notifications */}
				{currentUser && <NotificationBell userId={currentUser.id} />}

				{/* About Info */}
				<div
					className={`${styles.navActionItem} ${isAboutActive ? styles.activeNavAction : ''}`}
					onClick={() => navigate('/about')}
					title={t('about', 'About')}
				>
					<svg
						className={styles.infoIconSvg}
						viewBox="0 0 24 24"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
				</div>

				{/* Language Switcher */}
				<div
					ref={languageMenuRef}
					className={styles.navActionItem}
					onClick={() => {
						setShowLanguageMenu(!showLanguageMenu)
						setShowProfileMenu(false)
					}}
					title={t('language', 'Language')}
				>
					<span className={styles.navActionIcon}>🌐</span>

					{showLanguageMenu && (
						<div className={styles.languageDropdown}>
							<div onClick={() => changeLanguage('en')}>🇬🇧 English</div>
							<div onClick={() => changeLanguage('ru')}>🇷🇺 Русский</div>
							<div onClick={() => changeLanguage('hy')}>🇦🇲 Հայերեն</div>
						</div>
					)}
				</div>

				{/* Profile Dropdown */}
				{currentUser && (
					<div
						ref={profileMenuRef}
						className={`${styles.navActionItem} ${styles.profileMenu}`}
						onClick={() => {
							setShowProfileMenu(!showProfileMenu)
							setShowLanguageMenu(false)
						}}
					>
						<img
							src={currentUser?.avatar && currentUser.avatar !== 'default.jpg' ? `/uploads/${currentUser.avatar}` : '/assets/default.jpg'}
							alt={currentUser?.username || t('profile_tab', 'Profile')}
							className={styles.navProfileAvatar}
							onError={(e) => {
								const target = e.currentTarget
								if (!target.src.endsWith('/assets/default.jpg')) {
									target.src = '/assets/default.jpg'
								}
							}}
						/>

						{showProfileMenu && (
							<div className={styles.profileDropdown}>
								<div onClick={() => navigate(`/profile/${currentUser?.username || ''}`)}>
									👤 {t('my_profile', 'My Profile')}
								</div>
								<div onClick={() => navigate('/profile/settings')}>
									⚙️ {t('settings', 'Settings')}
								</div>
								<div
									className={styles.danger}
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
				)}
			</div>
		</header>
	)
}

export default Navbar
