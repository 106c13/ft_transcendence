import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DEVS } from '../../utils/aboutUtils'
import type { User } from '../../utils/profileUtils'
import styles from './Footer.module.css'

interface FooterProps {
	currentUser?: User | null
}

export default function Footer({ currentUser }: FooterProps) {
	const { t, i18n } = useTranslation()

	const scrollToTop = () => {
		const startPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
		if (startPosition <= 0) return

		const duration = 500
		let startTime: number | null = null

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

		requestAnimationFrame(step)
	}

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng)
	}

	const currentLang = i18n.language ? i18n.language.slice(0, 2) : 'en'

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

						<div className={styles.badgeRow}>
							<span className={styles.statusBadge}>
								<span className={styles.statusDot} aria-hidden="true" />
								{t('footer_status_operational')}
							</span>
							<span className={styles.capstoneBadge}>
								<span className={styles.badgeIcon} aria-hidden="true">♟️</span>
								{t('footer_capstone_badge')}
							</span>
						</div>
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
										<span className={styles.linkIcon}>⚔️</span>
										{t('play_online')}
									</Link>
								</li>
								<li>
									<Link to="/game?mode=bullet" className={styles.footerLink}>
										<span className={styles.linkIcon}>🔥</span>
										{t('footer_bullet_1m')}
									</Link>
								</li>
								<li>
									<Link to="/game?mode=blitz" className={styles.footerLink}>
										<span className={styles.linkIcon}>⚡</span>
										{t('footer_blitz_3m')}
									</Link>
								</li>
								<li>
									<Link to="/game?mode=rapid" className={styles.footerLink}>
										<span className={styles.linkIcon}>⏳</span>
										{t('footer_rapid_10m')}
									</Link>
								</li>
								<li>
									<Link to="/leaderboard" className={styles.footerLink}>
										<span className={styles.linkIcon}>🏆</span>
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
										<span className={styles.linkIcon}>💬</span>
										{t('chats')}
									</Link>
								</li>
								<li>
									<Link to={`/profile/${currentUser.username}`} className={styles.footerLink}>
										<span className={styles.linkIcon}>👤</span>
										{t('my_profile')}
									</Link>
								</li>
								<li>
									<Link to={`/profile/${currentUser.username}/rating`} className={styles.footerLink}>
										<span className={styles.linkIcon}>📈</span>
										{t('trend_7d')}
									</Link>
								</li>
								<li>
									<Link to="/profile/settings" className={styles.footerLink}>
										<span className={styles.linkIcon}>⚙️</span>
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
										<span className={styles.linkIcon}>🔑</span>
										{t('sign_in')}
									</Link>
								</li>
								<li>
									<Link to="/register" className={styles.footerLink}>
										<span className={styles.linkIcon}>✨</span>
										{t('create_account')}
									</Link>
								</li>
							</ul>
						</div>
					)}

					{/* About & 42 School Column (available to both authenticated & guest) */}
					<div className={styles.navCol}>
						<h4 className={styles.colTitle}>
							{t('footer_about_title')}
						</h4>
						<ul className={styles.linkList}>
							<li>
								<Link to="/about" className={styles.footerLink}>
									<span className={styles.linkIcon}>ℹ️</span>
									{t('about_project_title')}
								</Link>
							</li>
							<li>
								<a
									href={DEVS.arman.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.contributorLink}
									title={`${DEVS.arman.name} - ${DEVS.arman.shortRole}`}
								>
									<span className={styles.pieceCode}>{DEVS.arman.pieceSymbol}</span>
									<span className={styles.devName}>{DEVS.arman.name}</span>
									<span className={styles.externalMark}>↗</span>
								</a>
							</li>
							<li>
								<a
									href={DEVS.narek.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.contributorLink}
									title={`${DEVS.narek.name} - ${DEVS.narek.shortRole}`}
								>
									<span className={styles.pieceCode}>{DEVS.narek.pieceSymbol}</span>
									<span className={styles.devName}>{DEVS.narek.name}</span>
									<span className={styles.externalMark}>↗</span>
								</a>
							</li>
							<li>
								<a
									href={DEVS.hakob.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.contributorLink}
									title={`${DEVS.hakob.name} - ${DEVS.hakob.shortRole}`}
								>
									<span className={styles.pieceCode}>{DEVS.hakob.pieceSymbol}</span>
									<span className={styles.devName}>{DEVS.hakob.name}</span>
									<span className={styles.externalMark}>↗</span>
								</a>
							</li>
							<li>
								<a
									href="https://42.fr/"
									target="_blank"
									rel="noopener noreferrer"
									className={styles.footerLink}
								>
									<span className={styles.linkIcon}>🎓</span>
									{t('footer_school_network')}
									<span className={styles.externalMark}>↗</span>
								</a>
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
							<span aria-hidden="true">↑</span>
							<span>{t('footer_back_to_top')}</span>
						</button>
					</div>
				</div>
			</div>
		</footer>
	)
}
