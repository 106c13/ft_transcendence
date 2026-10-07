import { ExternalLink } from 'lucide-react';
import { DEVS } from '../../utils/aboutUtils';
import type { DevKey } from '../../utils/aboutUtils';
import styles from './AboutShowcase.module.css';

interface Props {
	selectedDev: DevKey;
	currentSquare?: string;
}

const AboutShowcase = ({ selectedDev, currentSquare }: Props) => {
	const dev = DEVS[selectedDev];

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
						<ExternalLink size={12} className={styles.externalIcon} aria-hidden="true" />
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
	);
};

export default AboutShowcase;
