import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => {
	const { t } = useTranslation();
	usePageTitle('page_title_not_found');

	return (
		<div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#0F172A_0%,#1E293B_100%)] text-slate-200 w-full box-border">
			<div className="text-center p-10 bg-slate-800 rounded-[20px] border border-slate-400/12 shadow-[0_25px_50px_rgba(0,0,0,0.3)] max-w-[500px] w-[90%] box-border">
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
	);
};

export default NotFoundPage;
