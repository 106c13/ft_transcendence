import { useTranslation } from 'react-i18next'
import type { ChallengeReceived } from '../../hooks/useChallengeSocket'
import styles from './ChallengeNotification.module.css'

type Props = {
	challenge: ChallengeReceived
	countdown: number
	onAccept: (challengeId: string) => void
	onDecline: (challengeId: string) => void
}

function ChallengeNotification({ challenge, countdown, onAccept, onDecline }: Props) {
	const { t } = useTranslation()

	const modeLabels: Record<string, string> = {
		'bullet': 'Bullet (1 min)',
		'bullet+2': 'Bullet (1|+2s)',
		'blitz': 'Blitz (3 min)',
		'blitz+2': 'Blitz (3|+2s)',
		'rapid': 'Rapid (10 min)',
		'rapid+2': 'Rapid (10|+2s)',
	}

	const progressPercent = (countdown / 30) * 100

	return (
		<div className={styles.challengeOverlay}>
			<div className={styles.challengeCard}>
				<div className={styles.challengeHeader}>
					<div className={styles.headerLeft}>
						<span className={styles.swordIcon}>⚔️</span>
						<span className={styles.headerText}>{t('challenge_incoming', 'Challenge!')}</span>
					</div>
					<span className={styles.countdownBadge}>{countdown}s</span>
				</div>

				<div className={styles.challengeBody}>
					<p className={styles.challengeText}>
						<strong>{challenge.from}</strong> {t('challenges_you_to', 'challenges you to a')}{' '}
						<strong>{modeLabels[challenge.mode] || challenge.mode}</strong> {t('game_excl', 'game!')}
					</p>
				</div>

				<div className={styles.countdownBar}>
					<div
						className={styles.countdownFill}
						style={{ width: `${progressPercent}%` }}
					/>
				</div>

				<div className={styles.challengeActions}>
					<button
						className={styles.acceptBtn}
						onClick={() => onAccept(challenge.challengeId)}
					>
						✓ {t('accept', 'Accept')}
					</button>
					<button
						className={styles.declineBtn}
						onClick={() => onDecline(challenge.challengeId)}
					>
						✗ {t('decline', 'Decline')}
					</button>
				</div>
			</div>
		</div>
	)
}

export default ChallengeNotification
