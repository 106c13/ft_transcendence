import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { MOVE_STEPS, DEVS, getTranslatedDev } from '../../utils/aboutUtils';
import type { DevKey } from '../../utils/aboutUtils';
import AboutHero from '../../components/AboutHero/AboutHero';
import AboutBoard from '../../components/AboutBoard/AboutBoard';
import AboutCurriculum from '../../components/AboutCurriculum/AboutCurriculum';
import styles from './AboutPage.module.css';

const AboutPage = () => {
	usePageTitle('page_title_about');
	const { t } = useTranslation();

	const [currentPly, setCurrentPly] = useState(0);
	const [isPlaying, setIsPlaying] = useState(true);

	const maxPly = MOVE_STEPS.length - 1;

	// Keyboard shortcut: Space for play/pause
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.isContentEditable)
			) {
				return;
			}

			if (e.code === 'Space' || e.key === ' ') {
				e.preventDefault();
				setIsPlaying((prev) => !prev);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	// Autoplay loop: loops through checkmate sequence
	useEffect(() => {
		if (!isPlaying) return;

		const isLastPly = currentPly === maxPly;
		// Fast checkmate sequence: 750ms between moves, 2500ms on checkmate, 1200ms on start position
		const delay = isLastPly ? 2500 : currentPly === 0 ? 1200 : 750;

		const timer = setTimeout(() => {
			setCurrentPly((prev) => (prev >= maxPly ? 0 : prev + 1));
		}, delay);

		return () => clearTimeout(timer);
	}, [isPlaying, currentPly, maxPly]);

	const handleTogglePlay = () => {
		setIsPlaying((prev) => !prev);
	};

	const currentStep = MOVE_STEPS[currentPly];

	// Team members in chronological project order: Hakob -> Arman -> Narek
	const devKeys: DevKey[] = ['hakob', 'arman', 'narek'];
	const devList = devKeys.map((key) => getTranslatedDev(DEVS[key], t));

	return (
		<div className="flex flex-col min-h-screen bg-slate-900 text-slate-200 pt-16 box-border w-full">
			<div className="flex-1 max-w-[1100px] w-full mx-auto px-4 pb-12 box-border flex flex-col gap-8">
				{/* Top Hero Section */}
				<AboutHero />

				{/* Unified Chessboard & Contributions Section */}
				<section className="w-full max-w-[1100px] mx-auto bg-slate-800 border border-slate-400/12 rounded-2xl p-3 min-[481px]:p-4 min-[1025px]:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] grid grid-cols-1 min-[861px]:grid-cols-[390px_minmax(0,1fr)] min-[1025px]:grid-cols-[440px_minmax(0,1fr)] gap-3 min-[481px]:gap-4 min-[861px]:gap-3 items-stretch box-border">
					{/* Left: Animated Chessboard with Mate */}
					<div className="w-full max-w-[440px] h-auto mx-auto min-[861px]:mx-0 min-[861px]:w-[390px] min-[861px]:h-[390px] min-[1025px]:w-[440px] min-[1025px]:h-[440px] aspect-square rounded-[10px] overflow-hidden bg-slate-900/60 shadow-[0_4px_16px_rgba(0,0,0,0.25)] flex box-border shrink-0">
						<AboutBoard
							fen={currentStep.fen}
							isCheckmate={Boolean(currentStep.isCheckmate)}
							isSmooth={true}
							onTogglePlay={handleTogglePlay}
						/>
					</div>

					{/* Right: Stacked Contribution Block */}
					<div className="flex flex-col gap-3 min-[861px]:gap-2.5 min-[1025px]:gap-3 w-full h-auto min-[861px]:h-[390px] min-[1025px]:h-[440px] min-w-0 box-border">
						{devList.map((dev) => (
							<div key={dev.id} className={styles.contributorCard}>
								<div className={styles.cardHeader}>
									<div className={styles.devMeta}>
										<div className={styles.pieceAvatar}>
											<img src={dev.pieceSvg} alt={dev.name} />
										</div>
										<div className={styles.devTitles}>
											<div className={styles.nameRow}>
												<h3 className={styles.devName}>{dev.name}</h3>
											</div>
											<p className={styles.shortRole}>{dev.shortRole}</p>
										</div>
									</div>

									<a
										href={dev.intraUrl}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.intraButton}
										title={`${dev.handle} on 42 Intra`}
									>
										<span>{dev.handle}</span>
										<ExternalLink size={12} className={styles.externalIcon} aria-hidden="true" />
									</a>
								</div>

								<p className={styles.statementText}>{dev.statement}</p>
							</div>
						))}
					</div>
				</section>

				{/* 42 Curriculum & Architecture Summary */}
				<AboutCurriculum />
			</div>
		</div>
	);
};

export default AboutPage;
