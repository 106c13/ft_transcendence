import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContextType } from '../../layouts/MainLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import SettingsHeader from '../../components/SettingsHeader/SettingsHeader';
import type { SettingsTab } from '../../utils/settingsUtils';
import ProfileInfoForm from '../../components/ProfileInfoForm/ProfileInfoForm';
import ChangePasswordForm from '../../components/ChangePasswordForm/ChangePasswordForm';
import styles from './SettingsPage.module.css';

const SettingsPage = () => {
	usePageTitle('page_title_settings');
	const { currentUser, setCurrentUser } = useOutletContext<LayoutContextType>();
	const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

	return (
		<div className={`${styles.settingsContainer} min-h-[calc(100vh-64px)] w-full flex flex-col items-center pt-20 px-4 pb-12 bg-slate-900 text-slate-100 box-border`}>
			<div className={`${styles.content} w-full max-w-[800px] flex flex-col gap-6`}>
				{/* Settings Header with title & Profile-matching tab options */}
				<SettingsHeader
					activeTab={activeTab}
					onSelectTab={setActiveTab}
				/>

				{/* Tab Content */}
				<div className={`${styles.sectionWrapper} w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-xl`}>
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
	);
};

export default SettingsPage;