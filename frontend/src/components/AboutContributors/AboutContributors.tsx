import { DEVS } from '../../constants/aboutConstants'
import type { DevKey } from '../../constants/aboutConstants'
import styles from './AboutContributors.module.css'

interface Props {
	selectedDev: DevKey | null
	onSelectDev: (dev: DevKey) => void
}

export default function AboutContributors({ selectedDev, onSelectDev }: Props) {
	return (
		<section>
			<h2 className={styles.sectionTitle}>
				<span>♚</span>
				<span>Contributors & Responsibilities</span>
			</h2>

			<div className={styles.contributorsGrid}>
				{(Object.keys(DEVS) as DevKey[]).map((key) => {
					const dev = DEVS[key]
					const isSelected = selectedDev === key

					return (
						<div
							key={key}
							className={`${styles.contributorCard} ${
								isSelected ? styles.contributorCardSelected : ''
							}`}
							onClick={() => onSelectDev(key)}
							data-about-contributor-card={key}
						>
							<div className={styles.cardTop}>
								<div className={styles.pieceAvatar}>
									<img src={dev.pieceSvg} alt={dev.pieceRoleName} />
								</div>

								<a
									href={dev.intraUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.intraButton}
									onClick={(e) => e.stopPropagation()}
								>
									<span>{dev.handle}</span>
									<span className={styles.externalIcon}>↗</span>
								</a>
							</div>

							<div className={styles.devDetails}>
								<h3 className={styles.devName}>{dev.name}</h3>
								<p className={styles.devRoleBadge}>
									{dev.pieceSymbol} {dev.shortRole}
								</p>
							</div>

							<p className={styles.statementBox}>{dev.statement}</p>

							<ul className={styles.highlightsList}>
								{dev.highlights.map((h, idx) => (
									<li key={idx} className={styles.highlightItem}>
										<span className={styles.highlightDot}>•</span>
										<span>{h}</span>
									</li>
								))}
							</ul>
						</div>
					)
				})}
			</div>
		</section>
	)
}
