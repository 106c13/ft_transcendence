import { DEVS } from '../../constants/aboutConstants'
import type { DevKey } from '../../constants/aboutConstants'
import styles from './AboutShowcase.module.css'

interface Props {
	selectedDev: DevKey | null
	currentSquare?: string
}

export default function AboutShowcase({ selectedDev, currentSquare }: Props) {
	// Fallback to arman when closed or unselected to avoid null errors during transitions
	const dev = selectedDev ? DEVS[selectedDev] : DEVS.arman

	return (
		<div className={styles.showcaseCard} data-about-showcase>
			<div className={styles.showcaseTop}>
				<div className={styles.showcaseHeader}>
					<span className={styles.showcaseBadge}>
						{dev.pieceSymbol} {dev.pieceRoleName}
						{currentSquare ? ` • Square ${currentSquare}` : ''}
					</span>
					<a
						href={dev.intraUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.intraButton}
					>
						<span>42 Intra</span>
						<span className={styles.externalIcon}>↗</span>
					</a>
				</div>

				<h3 className={styles.showcaseTitle}>
					{dev.name}
					<span className={styles.devHandle}>{dev.handle}</span>
				</h3>

				<p className={styles.showcaseRole}>{dev.shortRole}</p>
				<p className={styles.showcaseDesc}>{dev.statement}</p>
			</div>

			<p className={styles.showcaseQuote}>"{dev.tacticalMotto}"</p>
		</div>
	)
}
