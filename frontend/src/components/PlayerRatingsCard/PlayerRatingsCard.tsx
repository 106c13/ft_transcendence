import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { RatingInfo } from '../../constants/profileConstants'
import styles from './PlayerRatingsCard.module.css'

type Props = {
	ratings?: Record<string, RatingInfo | null> | null
	username?: string
}

const MODES = [
	{ key: 'bullet', nameKey: 'bullet_rating', defaultName: 'Bullet', icon: '🔥', time: '1 min' },
	{ key: 'blitz', nameKey: 'blitz_rating', defaultName: 'Blitz', icon: '⚡', time: '3 min' },
	{ key: 'rapid', nameKey: 'rapid_rating', defaultName: 'Rapid', icon: '⏳', time: '10 min' },
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
					<h3 className={styles.cardTitle}>{t('ratings_title', 'Ratings')}</h3>
				</div>
				<button
					className={styles.seeAllBtn}
					onClick={() => username ? navigate(`/profile/${username}`) : navigate('/profile')}
					type="button"
				>
					{t('see_all', 'See all')} →
				</button>
			</div>

			<div className={styles.ratingsListSection}>
				<div className={styles.listHeader}>
					<span>{t('mode', 'Mode')}</span>
					<span>{t('rating', 'Rating')}</span>
					<span>{t('win_rate', 'Win Rate')}</span>
				</div>

				<div className={styles.rowsContainer}>
					{MODES.map((mode) => {
						const info = ratings ? ratings[mode.key] : null
						const isNotPlayed = !info || info.gamesPlayed === 0
						const isProvisional = info?.isProvisional ?? true
						const ratingVal = info?.rating ?? 800
						const gamesPlayed = info?.gamesPlayed ?? 0
						const wins = info?.wins ?? 0
						const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0

						return (
							<div
								key={mode.key}
								className={styles.ratingRow}
								onClick={() => handleClickMode(mode.key)}
								role="button"
								tabIndex={0}
							>
								<div className={styles.modeCol}>
									<span className={styles.modeIcon}>{mode.icon}</span>
									<div className={styles.modeMeta}>
										<span className={styles.modeName}>{t(mode.nameKey, mode.defaultName)}</span>
										<span className={styles.modeTime}>{mode.time}</span>
									</div>
								</div>

								<div className={styles.ratingCol}>
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
								</div>

								<div className={styles.winrateCol}>
									<span className={`${styles.winrateValue} ${isNotPlayed ? styles.unrated : ''}`}>
										{isNotPlayed ? '—' : `${winRate}%`}
									</span>
									{!isNotPlayed && (
										<div className={styles.recordSub}>
											<span className={styles.wins}>{wins}W</span>
											<span>/</span>
											{(info?.draws ?? 0) > 0 && (
												<>
													<span className={styles.draws}>{info?.draws}D</span>
													<span>/</span>
												</>
											)}
											<span className={styles.losses}>{info?.losses ?? 0}L</span>
										</div>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

