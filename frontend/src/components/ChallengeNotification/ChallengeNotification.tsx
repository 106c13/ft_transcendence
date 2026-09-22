import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChallengeReceived } from '../../hooks/useChallengeSocket'
import styles from './ChallengeNotification.module.css'

type Props = {
	challenge: ChallengeReceived
	countdown?: number
	onAccept: (challengeId: string) => void
	onDecline: (challengeId: string) => void
}

function ChallengeNotification({ challenge, countdown = 30, onAccept, onDecline }: Props) {
	const { t } = useTranslation()
	const totalMs = (countdown || 30) * 1000
	const [remainingMs, setRemainingMs] = useState(totalMs)
	const lastTickRef = useRef<number | null>(null)

	const modeLabels: Record<string, string> = {
		'bullet': `${t('bullet')} (${t('time_1_min')})`,
		'bullet+2': `${t('bullet')} (${t('time_1_inc')})`,
		'blitz': `${t('blitz')} (${t('time_3_min')})`,
		'blitz+2': `${t('blitz')} (${t('time_3_inc')})`,
		'rapid': `${t('rapid')} (${t('time_10_min')})`,
		'rapid+2': `${t('rapid')} (${t('time_10_inc')})`,
	}

	useEffect(() => {
		lastTickRef.current = Date.now()

		const interval = setInterval(() => {
			const now = Date.now()
			const lastTick = lastTickRef.current ?? now
			const elapsed = now - lastTick

			setRemainingMs((prev) => {
				const next = prev - elapsed
				if (next <= 0) {
					clearInterval(interval)
					return 0
				}
				return next
			})
			lastTickRef.current = now
		}, 50)

		return () => clearInterval(interval)
	}, [])

	const displaySeconds = Math.max(0, Math.ceil(remainingMs / 1000))
	const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))

	return (
		<div className={styles.challengeOverlay}>
			<div className={styles.challengeCard}>
				<div className={styles.challengeHeader}>
					<div className={styles.headerLeft}>
						<span className={styles.swordIcon}>⚔️</span>
						<span className={styles.headerText}>{t('challenge_incoming', 'Challenge!')}</span>
					</div>
					<span className={styles.countdownBadge}>{displaySeconds}s</span>
				</div>

				<div className={styles.challengeBody}>
					<p className={styles.challengeText}>
						{t('challenges_you_to_game', {
							from: challenge.from,
							mode: modeLabels[challenge.mode] || challenge.mode,
							defaultValue: `${challenge.from} challenges you to a ${modeLabels[challenge.mode] || challenge.mode} game!`,
						})}
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
