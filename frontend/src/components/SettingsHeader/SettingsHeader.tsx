import { useTranslation } from 'react-i18next';
import { Settings, User, Lock } from 'lucide-react';
import type { SettingsTab } from '../../utils/settingsUtils';
import styles from './SettingsHeader.module.css';

export type { SettingsTab };

interface SettingsHeaderProps {
	activeTab: SettingsTab;
	onSelectTab: (tab: SettingsTab) => void;
}

const SettingsHeader = ({
	activeTab,
	onSelectTab,
}: SettingsHeaderProps) => {
	const { t } = useTranslation();

	return (
		<div className={styles.settingsHeader}>
			<div className={styles.topSection}>
				<div className={styles.titleGroup}>
					<div className={styles.iconBadge} aria-hidden="true">
						<Settings size={24} />
					</div>
					<div className={styles.textGroup}>
						<h1 className={styles.pageTitle}>{t('settings')}</h1>
						<p className={styles.pageSubtitle}>
							{t('settings_subtitle')}
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
					<span className={styles.tabIcon}>
						<User size={16} aria-hidden="true" />
					</span>
					<span>{t('profile_tab')}</span>
				</button>

				<button
					className={`${styles.tab} ${activeTab === 'security' ? styles.activeTab : ''}`}
					onClick={() => onSelectTab('security')}
					role="tab"
					aria-selected={activeTab === 'security'}
					type="button"
				>
					<span className={styles.tabIcon}>
						<Lock size={16} aria-hidden="true" />
					</span>
					<span>{t('security_tab')}</span>
				</button>
			</div>
		</div>
	);
};

export default SettingsHeader;
