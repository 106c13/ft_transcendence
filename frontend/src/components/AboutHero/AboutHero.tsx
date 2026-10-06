import { useTranslation } from 'react-i18next'
import { DEVS } from '../../constants/aboutConstants'
import styles from './AboutHero.module.css'

export default function AboutHero() {
	const { t } = useTranslation()

	return (
		<section className={styles.heroSection}>
			<h1 className={styles.heroTitle}>ft_transcendence</h1>

			<p className={styles.heroLead}>
				This project has been created as part of the 42 curriculum by{' '}
				<span className={styles.nicknameWrapper}>
					<a
						href={DEVS.arman.intraUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.nicknameLink}
					>
						{DEVS.arman.handle}
					</a>
					<span className={styles.nameTooltip}>{DEVS.arman.name}</span>
				</span>
				,{' '}
				<span className={styles.nicknameWrapper}>
					<a
						href={DEVS.narek.intraUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.nicknameLink}
					>
						{DEVS.narek.handle}
					</a>
					<span className={styles.nameTooltip}>{DEVS.narek.name}</span>
				</span>{' '}
				and{' '}
				<span className={styles.nicknameWrapper}>
					<a
						href={DEVS.hakob.intraUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.nicknameLink}
					>
						{DEVS.hakob.handle}
					</a>
					<span className={styles.nameTooltip}>{DEVS.hakob.name}</span>
				</span>
				.
			</p>

			<div className={styles.curriculumSubtitle}>
				{t('about_curriculum_badge', '42 Curriculum Capstone Project')}
			</div>
		</section>
	)
}
