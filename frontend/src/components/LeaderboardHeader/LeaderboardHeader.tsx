import { useTranslation } from 'react-i18next';
import { Trophy, Info, Calculator, Scale, Star, Medal } from 'lucide-react';
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
					<Trophy size={26} color="#eab308" aria-hidden="true" />
					<span>{t('global_leaderboard')}</span>
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
				<Info size={14} aria-hidden="true" />
				<span>{showFormulaInfo ? t('hide_formula') : t('how_it_works')}</span>
			</button>

			{/* Rating Formula Explainer Modal/Card with smooth accordion */}
			<div className={`${styles.explainerWrapper} ${showFormulaInfo ? styles.explainerOpen : ''}`}>
				<div className={styles.explainerInner}>
					<div className={styles.explainerCard}>
						<h3 className={styles.explainerTitle}>
							<Calculator size={18} aria-hidden="true" />
							<span>{t('leaderboard_system_title')}</span>
						</h3>
						<div className={styles.explainerGrid}>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									<Scale size={16} aria-hidden="true" />
									<span>{t('confidence_weighting')}</span>
								</div>
								<p className={styles.explainerItemText}>
									{t('confidence_desc')}
								</p>
							</div>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									<Star size={16} color="#eab308" aria-hidden="true" />
									<span>{t('versatility_bonus')}</span>
								</div>
								<p className={styles.explainerItemText}>
									{t('versatility_desc')}
								</p>
							</div>
							<div className={styles.explainerItem}>
								<div className={styles.explainerItemHeader}>
									<Medal size={16} color="#eab308" aria-hidden="true" />
									<span>{t('elite_podium')}</span>
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
