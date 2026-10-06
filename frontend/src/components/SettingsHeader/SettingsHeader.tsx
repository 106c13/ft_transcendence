import { useTranslation } from 'react-i18next'
import styles from './SettingsHeader.module.css'

export type SettingsTab = 'profile' | 'security'

interface SettingsHeaderProps {
	activeTab: SettingsTab
	onSelectTab: (tab: SettingsTab) => void
}

export default function SettingsHeader({
	activeTab,
	onSelectTab,
}: SettingsHeaderProps) {
	const { t } = useTranslation()

	return (
		<div className={styles.settingsHeader}>
			<div className={styles.topSection}>
				<div className={styles.titleGroup}>
					<div className={styles.iconBadge} aria-hidden="true">⚙️</div>
					<div className={styles.textGroup}>
						<h1 className={styles.pageTitle}>{t('settings', 'Settings')}</h1>
						<p className={styles.pageSubtitle}>
							{t('settings_subtitle', 'Manage your profile details and account security')}
						</p>
					</div>
				</div>
			</div>

			{/* Connected Tabs Header matching Profile Header */}
			<div className={styles.tabsHeader} role="tablist">
				<button
					className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`}
					onClick={() => onSelectTab('profile')}
					role="tab"
					aria-selected={activeTab === 'profile'}
					type="button"
				>
					<span className={styles.tabIcon}>👤</span>
					<span>{t('profile_tab', 'Profile')}</span>
				</button>

				<button
					className={`${styles.tab} ${activeTab === 'security' ? styles.activeTab : ''}`}
					onClick={() => onSelectTab('security')}
					role="tab"
					aria-selected={activeTab === 'security'}
					type="button"
				>
					<span className={styles.tabIcon}>🔒</span>
					<span>{t('security_tab', 'Security')}</span>
				</button>
			</div>
		</div>
	)
}
