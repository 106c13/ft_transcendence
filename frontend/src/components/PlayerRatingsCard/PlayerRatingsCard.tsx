import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { RatingInfo } from '../../constants/profileConstants'
import styles from './PlayerRatingsCard.module.css'

type Props = {
	ratings?: Record<string, RatingInfo | null> | null
	username?: string
}

const MODES = [
	{ key: 'bullet', nameKey: 'bullet_rating', defaultName: 'Bullet', icon: '🔥', time: '1 min', colorClass: styles.bulletBorder },
	{ key: 'blitz', nameKey: 'blitz_rating', defaultName: 'Blitz', icon: '⚡', time: '3 min', colorClass: styles.blitzBorder },
	{ key: 'rapid', nameKey: 'rapid_rating', defaultName: 'Rapid', icon: '⏳', time: '10 min', colorClass: styles.rapidBorder },
] as const

export default function PlayerRatingsCard({ ratings, username }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const handleClickMode = (modeKey: string) => {
		if (username) {
			navigate(`/profile/${username}/rating?mode=${modeKey}`)
		} else {
			navigate(`/profile/rating?mode=${modeKey}`)
		}
	}

	return (
		<div className={styles.ratingsCard}>
			<div className={styles.cardHeader}>
				<div className={styles.titleGroup}>
					<span className={styles.titleIcon}>🏆</span>
					<h3 className={styles.cardTitle}>{t('ratings_title', 'Ratings')}</h3>
				</div>
				<button
					className={styles.viewAllLink}
					onClick={() => username ? navigate(`/profile/${username}`) : navigate('/profile')}
					type="button"
				>
					{t('view_profile_stats', 'Profile')} →
				</button>
			</div>

			<div className={styles.ratingsList}>
				{MODES.map((mode) => {
					const info = ratings ? ratings[mode.key] : null
					const isNotPlayed = !info || info.gamesPlayed === 0
					const isProvisional = info?.isProvisional ?? true
					const ratingVal = info?.rating ?? 800

					return (
						<div
							key={mode.key}
							className={`${styles.ratingRow} ${mode.colorClass}`}
							onClick={() => handleClickMode(mode.key)}
							role="button"
							tabIndex={0}
						>
							<div className={styles.modeLeft}>
								<span className={styles.modeIcon}>{mode.icon}</span>
								<div className={styles.modeMeta}>
									<span className={styles.modeName}>{t(mode.nameKey, mode.defaultName)}</span>
									<span className={styles.modeTime}>{mode.time}</span>
								</div>
							</div>

							<div className={styles.modeRight}>
								<div className={styles.ratingValueWrapper}>
									<span className={`${styles.ratingValue} ${isNotPlayed ? styles.unrated : ''}`}>
										{isNotPlayed ? '—' : isProvisional ? `~${ratingVal}` : ratingVal}
									</span>
									{isProvisional && !isNotPlayed && (
										<span className={styles.provisionalBadge}>
											{info?.gamesPlayed}/5
										</span>
									)}
								</div>

								{!isNotPlayed && (
									<div className={styles.recordSub}>
										<span className={styles.wins}>{info?.wins ?? 0}W</span>
										<span>/</span>
										<span className={styles.losses}>{info?.losses ?? 0}L</span>
									</div>
								)}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

