import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LayoutContextType } from '../../layouts/MainLayout'
import ProfileInfoForm from '../../components/ProfileInfoForm/ProfileInfoForm'
import ChangePasswordForm from '../../components/ChangePasswordForm/ChangePasswordForm'
import styles from '../Common.module.css'

function SettingsPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { currentUser } = useOutletContext<LayoutContextType>()

	return (
		<div className={styles.profilePage}>
			<div className={styles.card}>
				<h1>{t('settings')}</h1>

				<ProfileInfoForm initialUser={currentUser} />

				<ChangePasswordForm />

				<button
					onClick={() => navigate('/profile')}
					className={styles.backButton}
				>
					← {t('back_to_profile')}
				</button>
			</div>
		</div>
	)
}

export default SettingsPage