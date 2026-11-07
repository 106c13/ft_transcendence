import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
	Swords,
	Trophy,
	MessageSquare,
	User,
	TrendingUp,
	Settings,
	LogIn,
	Sparkles,
	ArrowUp,
	Info,
	FileText,
	ShieldCheck,
} from 'lucide-react';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import type { User as UserType } from '../../utils/profileUtils';
import styles from './Footer.module.css';

interface FooterProps {
	currentUser?: UserType | null;
}

const Footer = ({ currentUser }: FooterProps) => {
	const { t, i18n } = useTranslation();

	const scrollToTop = () => {
		const startPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
		if (startPosition <= 0) return;

		const duration = 500;
		let startTime: number | null = null;

		const easeInOutCubic = (t: number) =>
			t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1

		const step = (currentTime: number) => {
			if (!startTime) startTime = currentTime
			const elapsed = currentTime - startTime
			const progress = Math.min(elapsed / duration, 1)
			const eased = easeInOutCubic(progress)
			const newY = Math.round(startPosition * (1 - eased))

			window.scrollTo(0, newY)

			if (progress < 1) {
				requestAnimationFrame(step)
			}
		}

		requestAnimationFrame(step);
	};

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng);
	};

	const currentLang = i18n.language ? i18n.language.slice(0, 2) : 'en';

	return (
		<footer className={styles.footer} role="contentinfo">
			<div className={styles.footerInner}>
				<div className={`${styles.footerGrid} ${!currentUser ? styles.guestGrid : ''}`}>
					{/* Brand Column */}
					<div className={styles.brandCol}>
						<Link to={currentUser ? '/home' : '/about'} className={styles.brandTitleLink}>
							<h3 className={styles.brandTitle}>ft_transcendence</h3>
						</Link>
						<p className={styles.brandTagline}>
							{t('footer_tagline')}
						</p>
					</div>

					{/* Authenticated Mode: Play & Compete Column */}
					{currentUser && (
						<div className={styles.navCol}>
							<h4 className={styles.colTitle}>
								{t('footer_play_title')}
							</h4>
							<ul className={styles.linkList}>
								<li>
									<Link to="/home" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<Swords size={16} aria-hidden="true" />
										</span>
										{t('play_online')}
									</Link>
								</li>
								<li>
									<Link to="/game?mode=bullet" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<GameModeIcon mode="bullet" size={16} />
										</span>
										{t('footer_bullet_1m')}
									</Link>
								</li>
								<li>
									<Link to="/game?mode=blitz" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<GameModeIcon mode="blitz" size={16} />
										</span>
										{t('footer_blitz_3m')}
									</Link>
								</li>
								<li>
									<Link to="/game?mode=rapid" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<GameModeIcon mode="rapid" size={16} />
										</span>
										{t('footer_rapid_10m')}
									</Link>
								</li>
								<li>
									<Link to="/leaderboard" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<Trophy size={16} color="#eab308" aria-hidden="true" />
										</span>
										{t('leaderboard')}
									</Link>
								</li>
							</ul>
						</div>
					)}

					{/* Authenticated Mode: Platform Column */}
					{currentUser && (
						<div className={styles.navCol}>
							<h4 className={styles.colTitle}>
								{t('footer_platform_title')}
							</h4>
							<ul className={styles.linkList}>
								<li>
									<Link to="/chat" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<MessageSquare size={16} aria-hidden="true" />
										</span>
										{t('chats')}
									</Link>
								</li>
								<li>
									<Link to={`/profile/${currentUser.username}`} className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<User size={16} aria-hidden="true" />
										</span>
										{t('my_profile')}
									</Link>
								</li>
								<li>
									<Link to={`/profile/${currentUser.username}/rating`} className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<TrendingUp size={16} aria-hidden="true" />
										</span>
										{t('trend_7d')}
									</Link>
								</li>
								<li>
									<Link to="/profile/settings" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<Settings size={16} aria-hidden="true" />
										</span>
										{t('settings')}
									</Link>
								</li>
							</ul>
						</div>
					)}

					{/* Guest / Auth Layout Mode: Get Started Column (no login required) */}
					{!currentUser && (
						<div className={styles.navCol}>
							<h4 className={styles.colTitle}>
								{t('footer_access_title')}
							</h4>
							<ul className={styles.linkList}>
								<li>
									<Link to="/login" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<LogIn size={16} aria-hidden="true" />
										</span>
										{t('sign_in')}
									</Link>
								</li>
								<li>
									<Link to="/register" className={styles.footerLink}>
										<span className={styles.linkIcon}>
											<Sparkles size={16} aria-hidden="true" />
										</span>
										{t('create_account')}
									</Link>
								</li>
							</ul>
						</div>
					)}

					{/* About Column (available to both authenticated & guest) */}
					<div className={styles.navCol}>
						<h4 className={styles.colTitle}>
							{t('about')}
						</h4>
						<ul className={styles.linkList}>
							<li>
								<Link to="/about" className={styles.footerLink}>
									<Info size={14} className={styles.linkIcon} aria-hidden="true" />
									{t('about_project_title')}
								</Link>
							</li>
							<li>
								<Link to="/terms" className={styles.footerLink}>
									<FileText size={14} className={styles.linkIcon} aria-hidden="true" />
									{t('terms_of_service')}
								</Link>
							</li>
							<li>
								<Link to="/privacy" className={styles.footerLink}>
									<ShieldCheck size={14} className={styles.linkIcon} aria-hidden="true" />
									{t('privacy_policy')}
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className={styles.footerBottom}>
					<div className={styles.copyrightGroup}>
						<span className={styles.copyrightText}>
							© {new Date().getFullYear()} ft_transcendence. {t('footer_all_rights')}
						</span>
						<div className={styles.legalLinksRow}>
							<Link to="/terms" className={styles.legalLink}>
								{t('terms_of_service')}
							</Link>
							<span className={styles.legalSeparator} aria-hidden="true">•</span>
							<Link to="/privacy" className={styles.legalLink}>
								{t('privacy_policy')}
							</Link>
						</div>
						<span className={styles.madeByText}>
							{t('footer_made_by')}
						</span>
					</div>

					<div className={styles.controlsGroup}>
						{/* Quick Language Switcher */}
						<div className={styles.languagePills} aria-label="Language selector">
							<button
								type="button"
								className={`${styles.langBtn} ${currentLang === 'en' ? styles.langActive : ''}`}
								onClick={() => changeLanguage('en')}
								title="English"
							>
								EN
							</button>
							<button
								type="button"
								className={`${styles.langBtn} ${currentLang === 'ru' ? styles.langActive : ''}`}
								onClick={() => changeLanguage('ru')}
								title="Русский"
							>
								RU
							</button>
							<button
								type="button"
								className={`${styles.langBtn} ${currentLang === 'hy' ? styles.langActive : ''}`}
								onClick={() => changeLanguage('hy')}
								title="Հայերեն"
							>
								HY
							</button>
						</div>

						{/* Back to top button */}
						<button
							type="button"
							className={styles.backToTopBtn}
							onClick={scrollToTop}
							title={t('footer_back_to_top')}
						>
							<ArrowUp size={14} aria-hidden="true" />
							<span>{t('footer_back_to_top')}</span>
						</button>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;

