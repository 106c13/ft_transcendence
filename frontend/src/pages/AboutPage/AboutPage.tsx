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
				<section className={`${styles.unifiedSection} w-full`}>
					{/* Left: Animated Chessboard with Mate */}
					<div className={styles.boardColumn}>
						<AboutBoard
							fen={currentStep.fen}
							isCheckmate={Boolean(currentStep.isCheckmate)}
							isSmooth={true}
							onTogglePlay={handleTogglePlay}
						/>
					</div>

					{/* Right: Stacked Contribution Block */}
					<div className={styles.contributorsColumn}>
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
