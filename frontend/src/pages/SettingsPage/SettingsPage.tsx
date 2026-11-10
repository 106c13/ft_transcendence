import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContextType } from '../../layouts/MainLayout';
import { usePageTitle } from '../../hooks/usePageTitle';
import SettingsHeader from '../../components/SettingsHeader/SettingsHeader';
import type { SettingsTab } from '../../utils/settingsUtils';
import ProfileInfoForm from '../../components/ProfileInfoForm/ProfileInfoForm';
import ChangePasswordForm from '../../components/ChangePasswordForm/ChangePasswordForm';

const SettingsPage = () => {
	usePageTitle('page_title_settings');
	const { currentUser, setCurrentUser } = useOutletContext<LayoutContextType>();
	const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

	return (
		<div className="min-h-screen w-full flex flex-col items-center pt-[72px] md:pt-[84px] px-4 md:px-10 pb-10 md:pb-[60px] text-slate-200 box-border">
			<div className="w-full max-w-[860px] mx-auto flex flex-col gap-5">
				{/* Settings Header with title & Profile-matching tab options */}
				<SettingsHeader
					activeTab={activeTab}
					onSelectTab={setActiveTab}
				/>

				{/* Tab Content */}
				<div className="w-full">
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