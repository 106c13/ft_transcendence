import { useTranslation } from 'react-i18next'
import styles from './NotFound.module.css'

function NotFound() {
	const { t } = useTranslation()

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

export default NotFound