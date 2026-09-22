import { useTranslation } from 'react-i18next'
import type { ModeRatingHistory, RatingCategory } from '../../hooks/useRatingHistory'
import styles from './MiniRatingChart.module.css'

type Props = {
	mode: RatingCategory
	history?: ModeRatingHistory
	onClick: () => void
}

const MODE_CONFIG: Record<
	RatingCategory,
	{ nameKey: string; defaultName: string; icon: string; time: string; color: string }
> = {
	bullet: {
		nameKey: 'bullet_rating',
		defaultName: 'Bullet',
		icon: '🔥',
		time: '1 min',
		color: '#F59E0B',
	},
	blitz: {
		nameKey: 'blitz_rating',
		defaultName: 'Blitz',
		icon: '⚡',
		time: '3 min',
		color: '#38BDF8',
	},
	rapid: {
		nameKey: 'rapid_rating',
		defaultName: 'Rapid',
		icon: '⏳',
		time: '10 min',
		color: '#818CF8',
	},
}

export default function MiniRatingChart({ mode, history, onClick }: Props) {
	const { t } = useTranslation()
	const config = MODE_CONFIG[mode]

	const isNotPlayed = !history || history.gamesPlayed === 0
	const isProvisional = history?.isProvisional ?? true
	const current = history?.current ?? 800
	const delta = history?.delta7Days ?? 0

	// SVG Sparkline calculation
	const points = history?.last7Days ?? []
	const width = 240
	const height = 50
	const padX = 6
	const padY = 6

	const ratings = points.map(p => p.rating)
	const rawMin = ratings.length > 0 ? Math.min(...ratings) : 800
	const rawMax = ratings.length > 0 ? Math.max(...ratings) : 800
	const diff = rawMax - rawMin
	const padRating = diff === 0 ? 30 : Math.max(15, diff * 0.15)
	const minVal = rawMin - padRating
	const maxVal = rawMax + padRating

	const chartPoints = points.map((p, idx) => {
		const x = padX + (idx / Math.max(1, points.length - 1)) * (width - padX * 2)
		const ratio = (p.rating - minVal) / (maxVal - minVal || 1)
		const y = height - padY - ratio * (height - padY * 2)
		return { x, y, rating: p.rating, label: p.label }
	})

	const pathD = chartPoints.length > 0
		? chartPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '')
		: ''

	const areaD = chartPoints.length > 0
		? `${pathD} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${height} L ${chartPoints[0].x.toFixed(1)} ${height} Z`
		: ''

	const lastPt = chartPoints[chartPoints.length - 1]
	const strokeColor = delta > 0 ? '#34D399' : delta < 0 ? '#F87171' : config.color
	const gradientId = `mini-grad-${mode}`

	return (
		<div className={styles.miniChartCard} onClick={onClick} role="button" tabIndex={0}>
			<div className={styles.header}>
				<div className={styles.modeInfo}>
					<span className={styles.modeIcon}>{config.icon}</span>
					<div className={styles.modeText}>
						<span className={styles.modeTitle}>{t(config.nameKey, config.defaultName)}</span>
						<span className={styles.modeTime}>
							{t(mode === 'bullet' ? 'time_1_min' : mode === 'blitz' ? 'time_3_min' : 'time_10_min', config.time)}
						</span>
					</div>
				</div>

				{isNotPlayed ? (
					<span className={`${styles.badge} ${styles.badgeNotPlayed}`}>
						{t('not_played', 'Not played')}
					</span>
				) : isProvisional ? (
					<span className={`${styles.badge} ${styles.badgeCalibrating}`}>
						{t('calibrating', 'Calibrating')} ({history?.gamesPlayed}/5)
					</span>
				) : (
					<span className={`${styles.badge} ${styles.badgeActive}`}>
						{history?.winRate}% {t('win_rate', 'Win rate')}
					</span>
				)}
			</div>

			<div className={styles.valueRow}>
				<div
					className={`${styles.ratingNumber} ${
						isNotPlayed
							? styles.ratingNumberUnrated
							: isProvisional
							? styles.ratingNumberProvisional
							: ''
					}`}
				>
					{isNotPlayed ? '—' : isProvisional ? `~${current}` : current}
				</div>

				{!isNotPlayed && (
					<div
						className={`${styles.deltaBadge} ${
							delta > 0 ? styles.deltaPos : delta < 0 ? styles.deltaNeg : styles.deltaZero
						}`}
					>
						<span>{delta > 0 ? `+${delta}` : delta}</span>
						<span className={styles.deltaLabel}>{t('7d', '7d')}</span>
					</div>
				)}
			</div>

			{/* 7-day sparkline SVG */}
			<div className={styles.chartContainer}>
				<svg
					viewBox={`0 0 ${width} ${height}`}
					className={styles.sparklineSvg}
					preserveAspectRatio="none"
				>
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
							<stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
						</linearGradient>
					</defs>

					{chartPoints.length > 0 && (
						<>
							{/* Fill area */}
							<path d={areaD} fill={`url(#${gradientId})`} />

							{/* Line */}
							<path
								d={pathD}
								fill="none"
								stroke={strokeColor}
								strokeWidth="2.2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</>
					)}
				</svg>

				{/* Active end point - rendered as a pure CSS circle to prevent any oval distortion */}
				{lastPt && (
					<div
						className={styles.activeDot}
						style={{
							left: `${(lastPt.x / width) * 100}%`,
							top: `${(lastPt.y / height) * 100}%`,
							backgroundColor: strokeColor,
							boxShadow: `0 0 0 2px #1E293B, 0 0 0 4px ${strokeColor}40`,
						}}
					/>
				)}
			</div>

			<div className={styles.statsRow}>
				<div className={styles.record}>
					<span className={styles.wins}>{history?.wins ?? 0}{t('wins_short', 'W')}</span>
					<span>/</span>
					<span className={styles.draws}>{history?.draws ?? 0}{t('draws_short', 'D')}</span>
					<span>/</span>
					<span className={styles.losses}>{history?.losses ?? 0}{t('losses_short', 'L')}</span>
				</div>
				<span className={styles.actionHint}>
					{t('view_full_chart', 'View chart')} ↗
				</span>
			</div>
		</div>
	)
}

