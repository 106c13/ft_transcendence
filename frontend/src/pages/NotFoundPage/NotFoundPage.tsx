import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';

const NotFoundPage = () => {
	const { t } = useTranslation();
	usePageTitle('page_title_not_found');

	return (
		<div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-slate-900 text-slate-100 w-full box-border">
			<div className="flex flex-col items-center max-w-md w-full p-8 sm:p-10 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-2xl text-center">
				<h1 className="text-7xl font-extrabold text-blue-500 mb-2 tracking-tight">404</h1>
				<h2 className="text-2xl font-bold text-slate-100 mb-3">{t('page_not_found')}</h2>
				<p className="text-sm text-slate-400 mb-6 leading-relaxed">
					{t('page_not_found_message')}
				</p>
				<a
					href="/home"
					className="inline-flex items-center justify-center py-2.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition duration-150 shadow-md shadow-blue-500/20"
				>
					{t('go_back_home')}
				</a>
			</div>
		</div>
	);
};

export default NotFoundPage;