import styles from './TopRankBadge.module.css';
import Tooltip from '../Tooltip/Tooltip';

interface TopRankBadgeProps {
	rank: number;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	className?: string;
	showTooltip?: boolean;
}

const TopRankBadge = ({
	rank,
	size = 'md',
	className = '',
	showTooltip = true,
}: TopRankBadgeProps) => {
	if (rank < 1 || rank > 3) return null;

	const sizeClass =
		size === 'sm'
			? styles.sizeSm
			: size === 'lg'
			? styles.sizeLg
			: size === 'xl'
			? styles.sizeXl
			: styles.sizeMd;

	const tooltipText =
		rank === 1 ? '1st Place • Champion' : rank === 2 ? '2nd Place • Runner-Up' : '3rd Place • Bronze Master';

	const badgeTypeClass =
		rank === 1 ? styles.goldBadge : rank === 2 ? styles.silverBadge : styles.bronzeBadge;

	let badgeIcon;

	// Render unique icons for 1st, 2nd, and 3rd place
	if (rank === 1) {
		badgeIcon = (
			<svg
				className={styles.badgeSvg}
				viewBox="0 0 36 36"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="goldCup" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#FFF176" />
						<stop offset="45%" stopColor="#FBC02D" />
						<stop offset="100%" stopColor="#F57F17" />
					</linearGradient>
					<linearGradient id="goldBase" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#FDD835" />
						<stop offset="100%" stopColor="#E65100" />
					</linearGradient>
					<linearGradient id="goldGleam" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#FFFFFF" />
						<stop offset="100%" stopColor="#FFF59D" />
					</linearGradient>
				</defs>
				{/* Trophy Base */}
				<path
					d="M11 31h14v2a1 1 0 0 1-1 1H12a1 1 0 0 1-1-1v-2Z"
					fill="url(#goldBase)"
				/>
				<rect x="13" y="27" width="10" height="4" rx="1" fill="url(#goldBase)" />
				{/* Trophy Stem */}
				<path d="M16 22h4v5h-4z" fill="url(#goldCup)" />
				{/* Trophy Cup */}
				<path
					d="M8 6h20v9a10 10 0 0 1-20 0V6Z"
					fill="url(#goldCup)"
				/>
				{/* Handles */}
				<path
					d="M8 8H5a3 3 0 0 0-3 3v2a4 4 0 0 0 4 4h2M28 8h3a3 3 0 0 1 3 3v2a4 4 0 0 1-4 4h-2"
					stroke="url(#goldCup)"
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
				{/* Crown Jewel Star inside Cup */}
				<path
					d="M18 10l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.4-2.5 1.4.5-2.8-2-2 2.8-.4L18 10Z"
					fill="url(#goldGleam)"
				/>
			</svg>
		);
	} else if (rank === 2) {
		badgeIcon = (
			<svg
				className={styles.badgeSvg}
				viewBox="0 0 36 36"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="silverCup" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#FFFFFF" />
						<stop offset="40%" stopColor="#CBD5E1" />
						<stop offset="100%" stopColor="#64748B" />
					</linearGradient>
					<linearGradient id="silverBase" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#E2E8F0" />
						<stop offset="100%" stopColor="#475569" />
					</linearGradient>
					<linearGradient id="silverRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#38BDF8" />
						<stop offset="100%" stopColor="#0284C7" />
					</linearGradient>
				</defs>
				{/* Medal Ribbon */}
				<path d="M12 2l4 12h-4L8 2h4Z" fill="url(#silverRibbon)" />
				<path d="M24 2l-4 12h4l4-12h-4Z" fill="url(#silverRibbon)" opacity="0.85" />
				{/* Medal Outer Rim */}
				<circle cx="18" cy="22" r="11" fill="url(#silverCup)" />
				<circle cx="18" cy="22" r="8.5" fill="url(#silverBase)" />
				{/* Inner Star */}
				<path
					d="M18 16l1.4 3.2 3.4.5-2.5 2.4.6 3.4L18 23.8l-2.9 1.7.6-3.4-2.5-2.4 3.4-.5L18 16Z"
					fill="#FFFFFF"
				/>
			</svg>
		);
	} else {
		badgeIcon = (
			<svg
				className={styles.badgeSvg}
				viewBox="0 0 36 36"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="bronzeCup" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#FDBA74" />
						<stop offset="45%" stopColor="#D97706" />
						<stop offset="100%" stopColor="#78350F" />
					</linearGradient>
					<linearGradient id="bronzeBase" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#B45309" />
						<stop offset="45%" stopColor="#451A03" />
					</linearGradient>
					<linearGradient id="bronzeRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#F43F5E" />
						<stop offset="100%" stopColor="#BE123C" />
					</linearGradient>
				</defs>
				{/* Ribbon */}
				<path d="M13 2l3 11h-3.5L9 2h4Z" fill="url(#bronzeRibbon)" />
				<path d="M23 2l-3 11h3.5L27 2h-4Z" fill="url(#bronzeRibbon)" opacity="0.85" />
				{/* Medal Disc */}
				<circle cx="18" cy="22" r="11" fill="url(#bronzeCup)" />
				<circle cx="18" cy="22" r="8.5" fill="url(#bronzeBase)" />
				{/* Inner Laurel / Star */}
				<path
					d="M18 17l1.3 2.8 3.1.4-2.2 2.2.5 3.1L18 24l-2.7 1.5.5-3.1-2.2-2.2 3.1-.4L18 17Z"
					fill="#FED7AA"
				/>
			</svg>
		);
	}

	const badge = (
		<span
			className={`${styles.badgeWrapper} ${sizeClass} ${badgeTypeClass} ${className}`}
			aria-label={tooltipText}
		>
			{badgeIcon}
		</span>
	);

	if (!showTooltip) {
		return badge;
	}

	return (
		<Tooltip content={tooltipText} position="top" inline>
			{badge}
		</Tooltip>
	);
};

export default TopRankBadge;
