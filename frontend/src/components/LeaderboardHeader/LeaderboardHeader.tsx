import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../pages/LeaderboardPage/LeaderboardPage.module.css';

interface LeaderboardHeaderProps {
	total: number;
	showFormulaInfo: boolean;
	onToggleFormulaInfo: () => void;
}

export const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({
	total,
	showFormulaInfo,
	onToggleFormulaInfo,
}) => {
	const { t } = useTranslation();

	return (
		<header className={styles.headerSection}>
			<div className={styles.titleRow}>
				<h1 className={styles.pageTitle}>
					<span>🏆</span> {t('global_leaderboard', 'Global Leaderboard')}
				</h1>
				<span className={styles.totalBadge}>
					{total} {t('players', 'Players')}
				</span>
			</div>
			<p className={styles.subtitle}>
				{t(
					'leaderboard_subtitle',
					'Rankings calculated from cross-format performance across Bullet, Blitz, and Rapid chess.'
				)}
			</p>

			<button
				className={styles.infoToggleBtn}
				onClick={(e) => {
					e.currentTarget.blur();
					onToggleFormulaInfo();
				}}
				type="button"
			>
				ℹ️ {showFormulaInfo ? t('hide_formula', 'Hide Rating Formula') : t('how_it_works', 'How Rating Works')}
			</button>

			{/* Rating Formula Explainer Modal/Card with smooth accordion */}
			<div className={`${styles.explainerWrapper} ${showFormulaInfo ? styles.explainerOpen : ''}`}>
				<div className={styles.explainerInner}>
					<div className={styles.explainerCard}>
						<h3 className={styles.explainerTitle}>
							<span>📐</span> {t('leaderboard_system_title', 'Leaderboard Rating Formula')}
						</h3>
						<div className={styles.explainerGrid}>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									⚖️ {t('confidence_weighting', 'Confidence Weighting')}
								</div>
								<p className={styles.explainerItemText}>
									{t(
										'confidence_desc',
										'Formats with 5+ games receive full 100% confidence weight. Provisional formats (1–4 games) scale dynamically, preventing single lucky wins from skewing ratings.'
									)}
								</p>
							</div>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									⭐ {t('versatility_bonus', 'Versatility Mastery')}
								</div>
								<p className={styles.explainerItemText}>
									{t(
										'versatility_desc',
										'Players competing across multiple calibrated formats earn a versatility bonus (+15 for 2 formats, +30 for all 3 formats), rewarding well-rounded grandmasters.'
									)}
								</p>
							</div>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									🥇 {t('elite_podium', 'Top 3 Honors')}
								</div>
								<p className={styles.explainerItemText}>
									{t(
										'podium_desc',
										'The top 3 global positions earn distinct Gold, Silver, and Bronze trophy badges displayed across leaderboards, profiles, and post-game screens.'
									)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};

export default LeaderboardHeader;
