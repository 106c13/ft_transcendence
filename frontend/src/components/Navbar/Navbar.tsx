import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Info, Globe, User, Settings, LogOut } from 'lucide-react';
import MessagesIcon from '../MessagesIcon/MessagesIcon';
import NotificationBell from '../NotificationBell/NotificationBell';
import PlayerSearch from '../PlayerSearch/PlayerSearch';
import styles from './Navbar.module.css';


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
	const isLeaderboardActive = location.pathname === '/leaderboard'

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

				{/* Leaderboard */}
				{currentUser && (
					<div
						className={`${styles.navActionItem} ${isLeaderboardActive ? styles.activeNavAction : ''}`}
						onClick={() => navigate('/leaderboard')}
						title={t('leaderboard')}
					>
						<span className={styles.navActionIcon}>
							<Trophy size={18} aria-hidden="true" />
						</span>
					</div>
				)}

				{/* About Info */}
				<div
					className={`${styles.navActionItem} ${isAboutActive ? styles.activeNavAction : ''}`}
					onClick={() => navigate('/about')}
					title={t('about')}
				>
					<span className={styles.navActionIcon}>
						<Info size={18} aria-hidden="true" />
					</span>
				</div>

				{/* Language Switcher */}
				<div
					ref={languageMenuRef}
					className={styles.navActionItem}
					onClick={() => {
						setShowLanguageMenu(!showLanguageMenu);
						setShowProfileMenu(false);
					}}
					title={t('language')}
				>
					<span className={styles.navActionIcon}>
						<Globe size={18} aria-hidden="true" />
					</span>

					{showLanguageMenu && (
						<div className={styles.languageDropdown}>
							<div onClick={() => changeLanguage('en')}>
								<span className={styles.langCode}>EN</span> English
							</div>
							<div onClick={() => changeLanguage('ru')}>
								<span className={styles.langCode}>RU</span> Русский
							</div>
							<div onClick={() => changeLanguage('hy')}>
								<span className={styles.langCode}>HY</span> Հայերեն
							</div>
						</div>
					)}
				</div>

				{/* Profile Dropdown */}
				{currentUser && (
					<div
						ref={profileMenuRef}
						className={`${styles.navActionItem} ${styles.profileMenu}`}
						onClick={() => {
							setShowProfileMenu(!showProfileMenu);
							setShowLanguageMenu(false);
						}}
					>
						<img
							src={currentUser?.avatar && currentUser.avatar !== 'default.jpg' ? `/uploads/${currentUser.avatar}` : '/assets/default.jpg'}
							alt={currentUser?.username || t('profile_tab')}
							className={styles.navProfileAvatar}
							onError={(e) => {
								const target = e.currentTarget;
								if (!target.src.endsWith('/assets/default.jpg')) {
									target.src = '/assets/default.jpg';
								}
							}}
						/>

						{showProfileMenu && (
							<div className={styles.profileDropdown}>
								<div onClick={() => navigate(`/profile/${currentUser?.username || ''}`)}>
									<User size={16} aria-hidden="true" />
									<span>{t('my_profile')}</span>
								</div>
								<div onClick={() => navigate('/profile/settings')}>
									<Settings size={16} aria-hidden="true" />
									<span>{t('settings')}</span>
								</div>
								<div
									className={styles.danger}
									onClick={() => {
										localStorage.removeItem('token');
										navigate('/login');
									}}
								>
									<LogOut size={16} aria-hidden="true" />
									<span>{t('logout')}</span>
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
