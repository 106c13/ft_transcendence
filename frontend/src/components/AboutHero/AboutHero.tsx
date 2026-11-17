import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { DEVS } from '../../utils/aboutUtils';
import Tooltip from '../Tooltip/Tooltip';
import styles from './AboutHero.module.css';

const AboutHero = () => {
	const { t } = useTranslation();

	return (
		<section className={styles.heroSection}>
			<h1 className={styles.heroTitle}>ft_transcendence</h1>

			<p className={styles.heroLead}>
				<Trans
					i18nKey="about_hero_lead"
					components={{
						armanLink: (
							<Tooltip content={t(DEVS.arman.nameKey)} position="top" inline>
								<Link
									to={DEVS.arman.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.nicknameLink}
								>
									{DEVS.arman.handle}
								</Link>
							</Tooltip>
						),
						narekLink: (
							<Tooltip content={t(DEVS.narek.nameKey)} position="top" inline>
								<Link
									to={DEVS.narek.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.nicknameLink}
								>
									{DEVS.narek.handle}
								</Link>
							</Tooltip>
						),
						hakobLink: (
							<Tooltip content={t(DEVS.hakob.nameKey)} position="top" inline>
								<Link
									to={DEVS.hakob.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.nicknameLink}
								>
									{DEVS.hakob.handle}
								</Link>
							</Tooltip>
						),
					}}
				/>
			</p>

			<div className={styles.curriculumSubtitle}>
				{t('about_curriculum_badge')}
			</div>
		</section>
	);
};

export default AboutHero;

