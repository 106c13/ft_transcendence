import { GraduationCap, Zap, Brain, ShieldCheck, Server } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import styles from './AboutCurriculum.module.css';

const AboutCurriculum = () => {
	const { t } = useTranslation();

	return (
		<section className={styles.curriculumCard}>
			<h2 className={styles.sectionTitle}>
				<GraduationCap size={22} aria-hidden="true" />
				<span>{t('about_curriculum_title')}</span>
			</h2>

			<p className={styles.curriculumText}>
				<Trans
					i18nKey="about_curriculum_desc"
					components={{
						bold: <strong />,
					}}
				/>
			</p>

			<div className={styles.techStackGrid}>
				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<Zap size={16} aria-hidden="true" />
						<span>{t('about_curriculum_gameplay_title')}</span>
					</div>
					<p className={styles.techItemDesc}>
						{t('about_curriculum_gameplay_desc')}
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<Brain size={16} aria-hidden="true" />
						<span>{t('about_curriculum_analysis_title')}</span>
					</div>
					<p className={styles.techItemDesc}>
						{t('about_curriculum_analysis_desc')}
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<ShieldCheck size={16} aria-hidden="true" />
						<span>{t('about_curriculum_auth_title')}</span>
					</div>
					<p className={styles.techItemDesc}>
						{t('about_curriculum_auth_desc')}
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<Server size={16} aria-hidden="true" />
						<span>{t('about_curriculum_infra_title')}</span>
					</div>
					<p className={styles.techItemDesc}>
						{t('about_curriculum_infra_desc')}
					</p>
				</div>
			</div>
		</section>
	);
};

export default AboutCurriculum;
