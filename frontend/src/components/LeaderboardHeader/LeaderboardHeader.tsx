import { useTranslation } from 'react-i18next';
import styles from '../../pages/LeaderboardPage/LeaderboardPage.module.css';

interface LeaderboardHeaderProps {
	total: number;
	showFormulaInfo: boolean;
	onToggleFormulaInfo: () => void;
}

const LeaderboardHeader = ({
	total,
	showFormulaInfo,
	onToggleFormulaInfo,
}: LeaderboardHeaderProps) => {
	const { t } = useTranslation();

	return (
		<header className={styles.headerSection}>
			<div className={styles.titleRow}>
				<h1 className={styles.pageTitle}>
					<span>🏆</span> {t('global_leaderboard')}
				</h1>
				<span className={styles.totalBadge}>
					{total} {t('players')}
				</span>
			</div>
			<p className={styles.subtitle}>
				{t('leaderboard_subtitle')}
			</p>

			<button
				className={styles.infoToggleBtn}
				onClick={(e) => {
					e.currentTarget.blur();
					onToggleFormulaInfo();
				}}
				type="button"
			>
				ℹ️ {showFormulaInfo ? t('hide_formula') : t('how_it_works')}
			</button>

			{/* Rating Formula Explainer Modal/Card with smooth accordion */}
			<div className={`${styles.explainerWrapper} ${showFormulaInfo ? styles.explainerOpen : ''}`}>
				<div className={styles.explainerInner}>
					<div className={styles.explainerCard}>
						<h3 className={styles.explainerTitle}>
							<span>📐</span> {t('leaderboard_system_title')}
						</h3>
						<div className={styles.explainerGrid}>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									⚖️ {t('confidence_weighting')}
								</div>
								<p className={styles.explainerItemText}>
									{t('confidence_desc')}
								</p>
							</div>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									⭐ {t('versatility_bonus')}
								</div>
								<p className={styles.explainerItemText}>
									{t('versatility_desc')}
								</p>
							</div>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									🥇 {t('elite_podium')}
								</div>
								<p className={styles.explainerItemText}>
									{t('podium_desc')}
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
