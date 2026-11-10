import { usePageTitle } from '../../hooks/usePageTitle';
import AboutHero from '../../components/AboutHero/AboutHero';
import AboutContributors from '../../components/AboutContributors/AboutContributors';
import AboutCurriculum from '../../components/AboutCurriculum/AboutCurriculum';

const AboutPage = () => {
	usePageTitle('page_title_about');

	return (
		<div className="flex flex-col min-h-screen bg-slate-900 text-slate-200 pt-16 box-border w-full">
			<div className="flex-1 max-w-[1100px] w-full mx-auto px-4 pt-4 pb-6 box-border flex flex-col gap-4">
				{/* Top Hero Section */}
				<AboutHero />

				{/* Unified Chessboard & Contributions Section */}
				<AboutContributors />

				{/* 42 Curriculum & Architecture Summary */}
				<AboutCurriculum />
			</div>
		</div>
	);
};

export default AboutPage;
