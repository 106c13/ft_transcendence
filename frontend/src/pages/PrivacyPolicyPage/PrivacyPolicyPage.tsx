import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';

const PrivacyPolicyPage = () => {
	usePageTitle('page_title_privacy');
	const { t } = useTranslation();

	return (
		<div className="flex flex-col min-h-screen bg-slate-900 text-slate-200 pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 w-full box-border">
			<article className="max-w-[885px] w-full mx-auto bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 sm:p-10 md:p-12 shadow-sm flex flex-col">
				{/* Document Header */}
				<header className="border-b border-slate-700/60 pb-8 mb-8">
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-blue-400">
						{t('privacy_hero_title')}
					</h1>
					<p className="text-xs sm:text-sm text-slate-400 mt-2">
						{t('legal_last_updated')} • {t('legal_version')}
					</p>
					<p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-4">
						{t('privacy_hero_subtitle')}
					</p>
					<div className="mt-4 p-4 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed">
						<span className="font-semibold text-slate-200 block mb-1">
							{t('privacy_tldr_title')}:
						</span>
						{t('privacy_tldr_desc')}
					</div>
				</header>

				{/* Document Sections in a Single Solid Flow */}
				<div className="flex flex-col gap-8 text-slate-300 text-sm sm:text-base leading-relaxed">
					{/* Section 1 */}
					<section className="flex flex-col gap-3">
						<h2 className="text-lg sm:text-xl font-semibold text-blue-400">
							1. {t('privacy_sec1_title')}
						</h2>
						<p>{t('privacy_sec1_p1')}</p>
						<ul className="list-disc list-inside space-y-2 text-slate-300 pl-1 text-sm sm:text-base">
							<li>
								<strong className="text-slate-100">{t('privacy_sec1_item1_title')}:</strong>{' '}
								{t('privacy_sec1_item1_desc')}
							</li>
							<li>
								<strong className="text-slate-100">{t('privacy_sec1_item2_title')}:</strong>{' '}
								{t('privacy_sec1_item2_desc')}
							</li>
							<li>
								<strong className="text-slate-100">{t('privacy_sec1_item3_title')}:</strong>{' '}
								{t('privacy_sec1_item3_desc')}
							</li>
							<li>
								<strong className="text-slate-100">{t('privacy_sec1_item4_title')}:</strong>{' '}
								{t('privacy_sec1_item4_desc')}
							</li>
						</ul>
					</section>

					{/* Section 2 */}
					<section className="flex flex-col gap-3 border-t border-slate-700/40 pt-6">
						<h2 className="text-lg sm:text-xl font-semibold text-blue-400">
							2. {t('privacy_sec2_title')}
						</h2>
						<p>{t('privacy_sec2_p1')}</p>
						<ul className="list-disc list-inside space-y-2 text-slate-300 pl-1 text-sm sm:text-base">
							<li>{t('privacy_sec2_use1')}</li>
							<li>{t('privacy_sec2_use2')}</li>
							<li>{t('privacy_sec2_use3')}</li>
							<li>{t('privacy_sec2_use4')}</li>
						</ul>
					</section>

					{/* Section 3 */}
					<section className="flex flex-col gap-3 border-t border-slate-700/40 pt-6">
						<h2 className="text-lg sm:text-xl font-semibold text-blue-400">
							3. {t('privacy_sec3_title')}
						</h2>
						<p>{t('privacy_sec3_p1')}</p>
						<ul className="list-disc list-inside space-y-2 text-slate-300 pl-1 text-sm sm:text-base">
							<li>
								<strong className="text-slate-100">{t('privacy_sec3_item1_title')}:</strong>{' '}
								{t('privacy_sec3_item1_desc')}
							</li>
							<li>
								<strong className="text-slate-100">{t('privacy_sec3_item2_title')}:</strong>{' '}
								{t('privacy_sec3_item2_desc')}
							</li>
						</ul>
					</section>

					{/* Section 4 */}
					<section className="flex flex-col gap-2 border-t border-slate-700/40 pt-6">
						<h2 className="text-lg sm:text-xl font-semibold text-blue-400">
							4. {t('privacy_sec4_title')}
						</h2>
						<p>{t('privacy_sec4_p1')}</p>
					</section>

					{/* Section 5 */}
					<section className="flex flex-col gap-3 border-t border-slate-700/40 pt-6">
						<h2 className="text-lg sm:text-xl font-semibold text-blue-400">
							5. {t('privacy_sec5_title')}
						</h2>
						<p>{t('privacy_sec5_p1')}</p>
						<ul className="list-disc list-inside space-y-2 text-slate-300 pl-1 text-sm sm:text-base">
							<li>{t('privacy_sec5_right1')}</li>
							<li>{t('privacy_sec5_right2')}</li>
							<li>{t('privacy_sec5_right3')}</li>
						</ul>
					</section>

					{/* Section 6 */}
					<section className="flex flex-col gap-2 border-t border-slate-700/40 pt-6">
						<h2 className="text-lg sm:text-xl font-semibold text-blue-400">
							6. {t('privacy_sec6_title')}
						</h2>
						<p>{t('privacy_sec6_p1')}</p>
					</section>

					{/* Closing text with links */}
					<footer className="border-t border-slate-700/60 pt-6 mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
						<p>
							{t('privacy_footer_note_prefix')}{' '}
							<Link to="/terms" className="text-blue-400 hover:text-blue-300 underline font-medium">
								{t('terms_of_service')}
							</Link>
							{'. '}{t('privacy_footer_about_prefix')}{' '}
							<Link to="/about" className="text-blue-400 hover:text-blue-300 underline font-medium">
								{t('about_project_title')}
							</Link>
							{'.'}
						</p>
					</footer>
				</div>
			</article>
		</div>
	);
};

export default PrivacyPolicyPage;
