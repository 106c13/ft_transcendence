import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Settings, LogOut } from 'lucide-react';
import Tooltip from '../Tooltip/Tooltip';
import styles from './ProfileMenu.module.css';

type Props = {
	currentUser: { id: number; username: string; avatar?: string };
	onOpen?: () => void;
};

const ProfileMenu = ({ currentUser, onOpen }: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const [prevPath, setPrevPath] = useState(location.pathname);

	// Dismiss on route change
	if (prevPath !== location.pathname) {
		setPrevPath(location.pathname);
		setIsOpen(false);
	}

	// Click outside to collapse
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const toggleMenu = () => {
		setIsOpen((prev) => {
			const next = !prev;
			if (next && onOpen) {
				onOpen();
			}
			return next;
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleMenu();
		} else if (e.key === 'Escape') {
			setIsOpen(false);
		}
	};

	const handleLogout = () => {
		setIsOpen(false);
		localStorage.removeItem('token');
		navigate('/login');
	};

	return (
		<div className={styles.profileMenuContainer} ref={menuRef}>
			<Tooltip
				content={currentUser.username || t('my_profile')}
				position="bottom"
				disabled={isOpen}
				offset="navbar"
			>
				<div
					className={`${styles.navActionItem} ${styles.profileMenu} ${isOpen ? styles.active : ''}`}
					onClick={toggleMenu}
					role="button"
					tabIndex={0}
					aria-label={currentUser.username || t('my_profile')}
					aria-expanded={isOpen}
					onKeyDown={handleKeyDown}
				>
					<img
						src={
							currentUser.avatar && currentUser.avatar !== 'default.jpg'
								? `/uploads/${currentUser.avatar}`
								: '/assets/default.jpg'
						}
						alt={currentUser.username || t('my_profile')}
						className={styles.navProfileAvatar}
						onError={(e) => {
							const target = e.currentTarget;
							if (!target.src.endsWith('/assets/default.jpg')) {
								target.src = '/assets/default.jpg';
							}
						}}
					/>
				</div>
			</Tooltip>

			{isOpen && (
				<div className={styles.profileDropdown}>
					<div
						onClick={(e) => {
							e.stopPropagation();
							setIsOpen(false);
							navigate(`/profile/${currentUser.username}`);
						}}
					>
						<User size={16} aria-hidden="true" />
						<span>{t('my_profile')}</span>
					</div>
					<div
						onClick={(e) => {
							e.stopPropagation();
							setIsOpen(false);
							navigate('/profile/settings');
						}}
					>
						<Settings size={16} aria-hidden="true" />
						<span>{t('settings')}</span>
					</div>
					<div
						className={styles.danger}
						onClick={(e) => {
							e.stopPropagation();
							handleLogout();
						}}
					>
						<LogOut size={16} aria-hidden="true" />
						<span>{t('logout')}</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProfileMenu;
