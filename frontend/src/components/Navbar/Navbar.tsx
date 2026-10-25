import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Info, Globe, Brain, Menu, X } from 'lucide-react';
import MessagesIcon from '../MessagesIcon/MessagesIcon';
import NotificationBell from '../NotificationBell/NotificationBell';
import PlayerSearch from '../PlayerSearch/PlayerSearch';
import ProfileMenu from '../ProfileMenu/ProfileMenu';
import NavTooltip, { useIsMobile } from '../NavTooltip/NavTooltip';
import styles from './Navbar.module.css';

type Props = {
	currentUser?: { id: number; username: string; avatar?: string } | null;
};

const Navbar = ({ currentUser }: Props) => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const isMobile = useIsMobile();

	const [showLanguageMenu, setShowLanguageMenu] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const languageMenuRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLElement>(null);

	// Close the language dropdown when clicking outside of it
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

	// Close the drawer when clicking outside the navbar or pressing Escape
	useEffect(() => {
		if (!mobileOpen) return;

		const handleOutside = (event: MouseEvent) => {
			if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
				setMobileOpen(false);
			}
		};
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setMobileOpen(false);
		};

		document.addEventListener('mousedown', handleOutside);
		document.addEventListener('keydown', handleKey);
		return () => {
			document.removeEventListener('mousedown', handleOutside);
			document.removeEventListener('keydown', handleKey);
		};
	}, [mobileOpen]);

	// Close the drawer on route change
	useEffect(() => {
		setMobileOpen(false);
	}, [location.pathname]);

	// Reset state when leaving the mobile layout
	useEffect(() => {
		if (!isMobile) setMobileOpen(false);
	}, [isMobile]);

	// Collapse the language modal together with the drawer
	useEffect(() => {
		if (!mobileOpen) setShowLanguageMenu(false);
	}, [mobileOpen]);

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng);
		setShowLanguageMenu(false);
	};

	const go = (path: string) => {
		navigate(path);
		setMobileOpen(false);
	};

	const isAboutActive = location.pathname === '/about';
	const isLeaderboardActive = location.pathname === '/leaderboard';
	const isAnalyzeActive = location.pathname.startsWith('/analyze');

	return (
		<header className={styles.navbar} ref={headerRef}>
			<div className={styles.navbarBrand} onClick={() => go(currentUser ? '/home' : '/login')}>
				<h2>ft_transcendence</h2>
			</div>

			{/* Hamburger (mobile only, right side) */}
			<button
				type="button"
				className={styles.menuToggle}
				onClick={() => setMobileOpen((open) => !open)}
				aria-label={mobileOpen ? t('closeMenu', 'Close menu') : t('openMenu', 'Open menu')}
				aria-expanded={mobileOpen}
				aria-controls="navbar-actions"
			>
				{mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
			</button>

			{/* Dimmed backdrop behind the drawer (mobile only) */}
			<div
				className={`${styles.backdrop} ${mobileOpen ? styles.backdropOpen : ''}`}
				onClick={() => setMobileOpen(false)}
				aria-hidden="true"
			/>

			<div
				id="navbar-actions"
				className={`${styles.navbarActions} ${mobileOpen ? styles.navbarActionsOpen : ''}`}
			>
				{/* 1. Player Search */}
				{currentUser && <PlayerSearch />}

				{/* 2. Notifications */}
				{currentUser && <NotificationBell userId={currentUser.id} />}

				{/* 3. Language Switcher */}
				<NavTooltip content={t('language')} position="bottom" disabled={showLanguageMenu} offset="navbar">
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
							if (e.target !== e.currentTarget) return;
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								setShowLanguageMenu(!showLanguageMenu);
							}
						}}
					>
						<span className={styles.navActionIcon}>
							<Globe size={18} aria-hidden="true" />
						</span>
						<span className={styles.navLabel}>{t('language')}</span>

						{showLanguageMenu && (
							<div className={styles.languageDropdown} onClick={(e) => e.stopPropagation()}>
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
				</NavTooltip>

				{/* 4. About Info */}
				<NavTooltip content={t('about')} position="bottom" offset="navbar">
					<div
						className={`${styles.navActionItem} ${isAboutActive ? styles.activeNavAction : ''}`}
						onClick={() => go('/about')}
						role="button"
						tabIndex={0}
						aria-label={t('about')}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								go('/about');
							}
						}}
					>
						<span className={styles.navActionIcon}>
							<Info size={18} aria-hidden="true" />
						</span>
						<span className={styles.navLabel}>{t('about')}</span>
					</div>
				</NavTooltip>

				{/* 5. Messages / Chat */}
				{currentUser && <MessagesIcon userId={currentUser.id} />}

				{/* Analysis */}
				{currentUser && (
					<NavTooltip content={t('analysis', 'Analysis')} position="bottom" offset="navbar">
						<div
							className={`${styles.navActionItem} ${isAnalyzeActive ? styles.activeNavAction : ''}`}
							onClick={() => go('/analyze')}
							role="button"
							tabIndex={0}
							aria-label={t('analysis', 'Analysis')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									go('/analyze');
								}
							}}
						>
							<span className={styles.navActionIcon}>
								<Brain size={18} aria-hidden="true" />
							</span>
							<span className={styles.navLabel}>{t('analysis', 'Analysis')}</span>
						</div>
					</NavTooltip>
				)}

				{/* 6. Leaderboard */}
				{currentUser && (
					<NavTooltip content={t('leaderboard')} position="bottom" offset="navbar">
						<div
							className={`${styles.navActionItem} ${isLeaderboardActive ? styles.activeNavAction : ''}`}
							onClick={() => go('/leaderboard')}
							role="button"
							tabIndex={0}
							aria-label={t('leaderboard')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									go('/leaderboard');
								}
							}}
						>
							<span className={styles.navActionIcon}>
								<Trophy size={18} aria-hidden="true" />
							</span>
							<span className={styles.navLabel}>{t('leaderboard')}</span>
						</div>
					</NavTooltip>
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