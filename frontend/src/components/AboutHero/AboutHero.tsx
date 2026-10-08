import { useTranslation } from 'react-i18next';
import { DEVS } from '../../utils/aboutUtils';
import Tooltip from '../Tooltip/Tooltip';
import styles from './AboutHero.module.css';

const AboutHero = () => {
	const { t } = useTranslation();

	return (
		<section className={styles.heroSection}>
			<h1 className={styles.heroTitle}>ft_transcendence</h1>

			<p className={styles.heroLead}>
				This project has been created as part of the 42 curriculum by{' '}
				<Tooltip content={DEVS.arman.name} position="top" inline>
					<a
						href={DEVS.arman.intraUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.nicknameLink}
					>
						{DEVS.arman.handle}
					</a>
				</Tooltip>
				,{' '}
				<Tooltip content={DEVS.narek.name} position="top" inline>
					<a
						href={DEVS.narek.intraUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.nicknameLink}
					>
						{DEVS.narek.handle}
					</a>
				</Tooltip>{' '}
				and{' '}
				<Tooltip content={DEVS.hakob.name} position="top" inline>
					<a
						href={DEVS.hakob.intraUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.nicknameLink}
					>
						{DEVS.hakob.handle}
					</a>
				</Tooltip>
				.
			</p>

			<div className={styles.curriculumSubtitle}>
				{t('about_curriculum_badge')}
			</div>
		</section>
	);
};

export default AboutHero;

