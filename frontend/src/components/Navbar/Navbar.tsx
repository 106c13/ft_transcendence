import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Info, Globe } from 'lucide-react';
import MessagesIcon from '../MessagesIcon/MessagesIcon';
import NotificationBell from '../NotificationBell/NotificationBell';
import PlayerSearch from '../PlayerSearch/PlayerSearch';
import ProfileMenu from '../ProfileMenu/ProfileMenu';
import Tooltip from '../Tooltip/Tooltip';
import styles from './Navbar.module.css';


type Props = {
	currentUser?: { id: number; username: string; avatar?: string } | null;
};

const Navbar = ({ currentUser }: Props) => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const [showLanguageMenu, setShowLanguageMenu] = useState(false);
	const languageMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
				setShowLanguageMenu(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng);
		setShowLanguageMenu(false);
	};

	const isAboutActive = location.pathname === '/about';
	const isLeaderboardActive = location.pathname === '/leaderboard';

	return (
		<header className={styles.navbar}>
			<div className={styles.navbarBrand} onClick={() => navigate(currentUser ? '/home' : '/login')}>
				<h2>ft_transcendence</h2>
			</div>

			<div className={styles.navbarActions}>
				{/* 1. Player Search */}
				{currentUser && <PlayerSearch />}

				{/* 2. Notifications */}
				{currentUser && <NotificationBell userId={currentUser.id} />}

				{/* 3. Language Switcher */}
				<Tooltip content={t('language')} position="bottom" disabled={showLanguageMenu} offset="navbar">
					<div
						ref={languageMenuRef}
						className={`${styles.navActionItem} ${showLanguageMenu ? styles.activeNavAction : ''}`}
						onClick={() => {
							setShowLanguageMenu(!showLanguageMenu);
						}}
						role="button"
						tabIndex={0}
						aria-label={t('language')}
						aria-expanded={showLanguageMenu}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								setShowLanguageMenu(!showLanguageMenu);
							}
						}}
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
				</Tooltip>

				{/* 4. About Info */}
				<Tooltip content={t('about')} position="bottom" offset="navbar">
					<div
						className={`${styles.navActionItem} ${isAboutActive ? styles.activeNavAction : ''}`}
						onClick={() => navigate('/about')}
						role="button"
						tabIndex={0}
						aria-label={t('about')}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								navigate('/about');
							}
						}}
					>
						<span className={styles.navActionIcon}>
							<Info size={18} aria-hidden="true" />
						</span>
					</div>
				</Tooltip>

				{/* 5. Messages / Chat */}
				{currentUser && <MessagesIcon userId={currentUser.id} />}

				{/* 6. Leaderboard */}
				{currentUser && (
					<Tooltip content={t('leaderboard')} position="bottom" offset="navbar">
						<div
							className={`${styles.navActionItem} ${isLeaderboardActive ? styles.activeNavAction : ''}`}
							onClick={() => navigate('/leaderboard')}
							role="button"
							tabIndex={0}
							aria-label={t('leaderboard')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									navigate('/leaderboard');
								}
							}}
						>
							<span className={styles.navActionIcon}>
								<Trophy size={18} aria-hidden="true" />
							</span>
						</div>
					</Tooltip>
				)}

				{/* Profile Dropdown */}
				{currentUser && (
					<ProfileMenu
						currentUser={currentUser}
						onOpen={() => setShowLanguageMenu(false)}
					/>
				)}
			</div>
		</header>
	);
};

export default Navbar;
