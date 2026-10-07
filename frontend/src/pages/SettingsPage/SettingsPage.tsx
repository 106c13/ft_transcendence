import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContextType } from '../../layouts/MainLayout'
import { usePageTitle } from '../../hooks/usePageTitle'
import SettingsHeader from '../../components/SettingsHeader/SettingsHeader';
import type { SettingsTab } from '../../utils/settingsUtils';
import ProfileInfoForm from '../../components/ProfileInfoForm/ProfileInfoForm'
import ChangePasswordForm from '../../components/ChangePasswordForm/ChangePasswordForm'
import styles from './SettingsPage.module.css'

function SettingsPage() {
	usePageTitle('page_title_settings')
	const { currentUser, setCurrentUser } = useOutletContext<LayoutContextType>()
	const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

	return (
		<div className={styles.settingsContainer}>
			<div className={styles.content}>
				{/* Settings Header with title & Profile-matching tab options */}
				<SettingsHeader
					activeTab={activeTab}
					onSelectTab={setActiveTab}
				/>

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