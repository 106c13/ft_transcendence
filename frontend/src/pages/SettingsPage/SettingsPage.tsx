import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LayoutContextType } from '../../layouts/MainLayout'
import { usePageTitle } from '../../hooks/usePageTitle'
import ProfileInfoForm from '../../components/ProfileInfoForm/ProfileInfoForm'
import ChangePasswordForm from '../../components/ChangePasswordForm/ChangePasswordForm'
import styles from './SettingsPage.module.css'

type SettingsTab = 'profile' | 'security'

function SettingsPage() {
	const { t } = useTranslation()
	usePageTitle('page_title_settings', 'Settings')
	const navigate = useNavigate()
	const { currentUser, setCurrentUser } = useOutletContext<LayoutContextType>()
	const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

	const handleBack = () => {
		if (currentUser?.username) {
			navigate(`/profile/${currentUser.username}`)
		} else {
			navigate('/profile')
		}
	}

	return (
		<div className={styles.settingsContainer}>
			<div className={styles.content}>
				{/* Top Bar with Back Button */}
				<div className={styles.topBar}>
					<button
						onClick={handleBack}
						className={styles.backBtn}
						type="button"
					>
						← {t('back_to_profile', 'Back to Profile')}
					</button>
				</div>

				{/* Header title & subtitle */}
				<div className={styles.headerArea}>
					<h1 className={styles.pageTitle}>{t('settings', 'Settings')}</h1>
					<p className={styles.pageSubtitle}>
						{t('settings_subtitle', 'Manage your profile details and account security')}
					</p>
				</div>

				{/* Tab Navigation */}
				<div className={styles.tabs} role="tablist">
					<button
						className={`${styles.tab} ${
							activeTab === 'profile' ? styles.activeTab : ''
						}`}
						onClick={() => setActiveTab('profile')}
						role="tab"
						aria-selected={activeTab === 'profile'}
						type="button"
					>
						<span>👤</span>
						<span>{t('profile_tab', 'Profile')}</span>
					</button>

					<button
						className={`${styles.tab} ${
							activeTab === 'security' ? styles.activeTab : ''
						}`}
						onClick={() => setActiveTab('security')}
						role="tab"
						aria-selected={activeTab === 'security'}
						type="button"
					>
						<span>🔒</span>
						<span>{t('security_tab', 'Security')}</span>
					</button>
				</div>

				{/* Tab Content */}
				<div className={styles.sectionWrapper}>
					{activeTab === 'profile' && (
						<ProfileInfoForm
							initialUser={currentUser}
							onUserUpdated={updated => setCurrentUser(updated)}
						/>
					)}

					{activeTab === 'security' && <ChangePasswordForm />}
				</div>
			</div>
		</div>
	)
}

export default SettingsPage