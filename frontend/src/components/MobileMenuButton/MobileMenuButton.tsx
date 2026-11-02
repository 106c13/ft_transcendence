import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import styles from './MobileMenuButton.module.css';

type Props = {
	isOpen: boolean;
	onToggle: () => void;
	unreadNotifications: number;
	unreadMessages: number;
};

const MobileMenuButton = ({
	isOpen,
	onToggle,
	unreadNotifications,
	unreadMessages,
}: Props) => {
	const { t } = useTranslation();

	const hasNotifications = unreadNotifications > 0;
	const hasMessages = unreadMessages > 0;
	const showDot = !isOpen && (hasNotifications || hasMessages);

	const getDotColorClass = () => {
		if (hasNotifications && hasMessages) return styles.dotBoth;
		if (hasNotifications) return styles.dotNotification;
		return styles.dotMessage;
	};

	return (
		<button
			type="button"
			className={styles.menuToggle}
			onClick={onToggle}
			aria-label={isOpen ? t('closeMenu', 'Close menu') : t('openMenu', 'Open menu')}
			aria-expanded={isOpen}
			aria-controls="navbar-actions"
		>
			{isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
			{showDot && (
				<span
					className={`${styles.statusDot} ${getDotColorClass()}`}
					aria-hidden="true"
				/>
			)}
		</button>
	);
};

export default MobileMenuButton;

