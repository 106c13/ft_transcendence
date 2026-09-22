import { useTranslation } from 'react-i18next'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from './NotFoundPage.module.css'

function NotFoundPage() {
	const { t } = useTranslation()
	usePageTitle('page_title_not_found', 'Page Not Found')

	return (
		<div className={styles.notFoundContainer}>
			<div className={styles.notFoundContent}>
				<h1 className={styles.notFoundCode}>404</h1>
				<h2 className={styles.notFoundTitle}>{t('page_not_found')}</h2>
				<p className={styles.notFoundMessage}>
					{t('page_not_found_message')}
				</p>
				<a href="/home" className={styles.notFoundButton}>
					{t('go_back_home')}
				</a>
			</div>
		</div>
	)
}

export default NotFoundPage