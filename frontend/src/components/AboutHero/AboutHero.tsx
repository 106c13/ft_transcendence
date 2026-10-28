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
							<Tooltip content={t(DEVS.arman.nameKey, DEVS.arman.name)} position="top" inline>
								<a
									href={DEVS.arman.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.nicknameLink}
								>
									{DEVS.arman.handle}
								</a>
							</Tooltip>
						),
						narekLink: (
							<Tooltip content={t(DEVS.narek.nameKey, DEVS.narek.name)} position="top" inline>
								<a
									href={DEVS.narek.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.nicknameLink}
								>
									{DEVS.narek.handle}
								</a>
							</Tooltip>
						),
						hakobLink: (
							<Tooltip content={t(DEVS.hakob.nameKey, DEVS.hakob.name)} position="top" inline>
								<a
									href={DEVS.hakob.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.nicknameLink}
								>
									{DEVS.hakob.handle}
								</a>
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

