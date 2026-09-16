import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ModeRatingHistory, RatingCategory, AllTimeRatingPoint } from '../../hooks/useRatingHistory'
import styles from './BigRatingChart.module.css'

type Props = {
	mode: RatingCategory
	history?: ModeRatingHistory
}

const MODE_META: Record<RatingCategory, { nameKey: string; defaultName: string; icon: string; color: string }> = {
	bullet: { nameKey: 'bullet_rating', defaultName: 'Bullet', icon: '🔥', color: '#F59E0B' },
	blitz: { nameKey: 'blitz_rating', defaultName: 'Blitz', icon: '⚡', color: '#38BDF8' },
	rapid: { nameKey: 'rapid_rating', defaultName: 'Rapid', icon: '⏳', color: '#818CF8' },
}

export default function BigRatingChart({ mode, history }: Props) {
	const { t } = useTranslation()
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
	const meta = MODE_META[mode]

	const points: AllTimeRatingPoint[] = useMemo(() => history?.allTime ?? [], [history])

	// Dimensions
	const svgWidth = 760
	const svgHeight = 300
	const padLeft = 55
	const padRight = 30
	const padTop = 25
	const padBottom = 40
	const chartWidth = svgWidth - padLeft - padRight
	const chartHeight = svgHeight - padTop - padBottom

	// Compute rating bounds
	const { minRating, maxRating, yTicks } = useMemo(() => {
		if (points.length === 0) {
			return { minRating: 700, maxRating: 900, yTicks: [700, 750, 800, 850, 900] }
		}

		const ratings = points.map(p => p.rating)
		const rawMin = Math.min(...ratings)
		const rawMax = Math.max(...ratings)
		const diff = rawMax - rawMin

		const step = diff <= 100 ? 25 : diff <= 300 ? 50 : 100
		const pMin = Math.max(0, Math.floor((rawMin - step * 0.5) / step) * step)
		const pMax = Math.ceil((rawMax + step * 0.5) / step) * step
		const finalMax = pMax === pMin ? pMin + step * 4 : pMax

		const ticks: number[] = []
		const numTicks = 5
		const tickStep = (finalMax - pMin) / (numTicks - 1)
		for (let i = 0; i < numTicks; i++) {
			ticks.push(Math.round(pMin + i * tickStep))
		}

		return { minRating: pMin, maxRating: finalMax, yTicks: ticks }
	}, [points])

	// Map points to SVG coordinates
	const svgPoints = useMemo(() => {
		if (points.length === 0) return []
		const range = maxRating - minRating || 1

		return points.map((p, idx) => {
			const x = points.length === 1
				? padLeft + chartWidth / 2
				: padLeft + (idx / (points.length - 1)) * chartWidth
			const y = padTop + chartHeight - ((p.rating - minRating) / range) * chartHeight
			return { ...p, svgX: x, svgY: y }
		})
	}, [points, minRating, maxRating, chartWidth, chartHeight, padLeft, padTop])

	// Generate path data
	const { lineD, areaD } = useMemo(() => {
		if (svgPoints.length === 0) return { lineD: '', areaD: '' }
		if (svgPoints.length === 1) {
			const pt = svgPoints[0]
			const lD = `M ${padLeft} ${pt.svgY} L ${svgWidth - padRight} ${pt.svgY}`
			const aD = `${lD} L ${svgWidth - padRight} ${padTop + chartHeight} L ${padLeft} ${padTop + chartHeight} Z`
			return { lineD: lD, areaD: aD }
		}

		const lD = svgPoints.reduce(
			(acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.svgX.toFixed(1)} ${pt.svgY.toFixed(1)}`,
			''
		)
		const aD = `${lD} L ${svgPoints[svgPoints.length - 1].svgX.toFixed(1)} ${padTop + chartHeight} L ${svgPoints[0].svgX.toFixed(1)} ${padTop + chartHeight} Z`
		return { lineD: lD, areaD: aD }
	}, [svgPoints, padLeft, padRight, padTop, chartHeight, svgWidth])

	// X-axis label ticks (pick at most 6 evenly distributed)
	const xTicks = useMemo(() => {
		if (svgPoints.length <= 1) return []
		if (svgPoints.length <= 6) return svgPoints

		const result = []
		const step = (svgPoints.length - 1) / 5
		for (let i = 0; i < 6; i++) {
			const idx = Math.min(svgPoints.length - 1, Math.round(i * step))
			result.push(svgPoints[idx])
		}
		return result
	}, [svgPoints])

	const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
		if (svgPoints.length === 0) return
		const rect = e.currentTarget.getBoundingClientRect()
		const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth

		let closestIdx = 0
		let minDistance = Infinity

		for (let i = 0; i < svgPoints.length; i++) {
			const dist = Math.abs(svgPoints[i].svgX - mouseX)
			if (dist < minDistance) {
				minDistance = dist
				closestIdx = i
			}
		}

		setHoveredIdx(closestIdx)
	}

	const activePoint = hoveredIdx !== null && svgPoints[hoveredIdx] ? svgPoints[hoveredIdx] : null
	const gradientId = `big-grad-${mode}`

	return (
		<div className={styles.bigChartWrapper}>
			{/* Top stats summary */}
			<div className={styles.statsGrid}>
				<div className={styles.statCard}>
					<span className={styles.statLabel}>{t('current_rating', 'Current Rating')}</span>
					<span className={styles.statValue}>{history?.current ?? '—'}</span>
					<span className={styles.statSub}>
						{history?.isProvisional ? t('provisional', 'Provisional') : t('calibrated', 'Calibrated')}
					</span>
				</div>

				<div className={styles.statCard}>
					<span className={styles.statLabel}>🏆 {t('peak_rating', 'Peak Rating')}</span>
					<span className={styles.statValue}>{history?.peak ?? '—'}</span>
					<span className={styles.statSub}>{t('all_time_high', 'All-time high')}</span>
				</div>

				<div className={styles.statCard}>
					<span className={styles.statLabel}>📉 {t('lowest_rating', 'Lowest Rating')}</span>
					<span className={styles.statValue}>{history?.lowest ?? '—'}</span>
					<span className={styles.statSub}>{t('all_time_low', 'All-time low')}</span>
				</div>

				<div className={styles.statCard}>
					<span className={styles.statLabel}>⚔️ {t('total_games', 'Total Games')}</span>
					<span className={styles.statValue}>{history?.gamesPlayed ?? 0}</span>
					<span className={styles.statSub}>
						{history?.wins ?? 0}W / {history?.draws ?? 0}D / {history?.losses ?? 0}L
					</span>
				</div>

				<div className={styles.statCard}>
					<span className={styles.statLabel}>🎯 {t('win_rate', 'Win Rate')}</span>
					<span className={styles.statValue}>{history?.winRate ?? 0}%</span>
					<span className={styles.statSub}>{t('overall_success', 'Overall success')}</span>
				</div>
			</div>

			{/* Big chart container */}
			<div className={styles.chartCard}>
				<div className={styles.chartHeader}>
					<div className={styles.chartTitle}>
						<span className={styles.chartModeIcon}>{meta.icon}</span>
						<span className={styles.chartModeTitle}>{t(meta.nameKey, meta.defaultName)} Rating Progression</span>
					</div>
					<span className={styles.pointsCount}>
						{points.length} {t('matches_recorded', 'matches recorded')}
					</span>
				</div>

				{points.length === 0 ? (
					<div className={styles.emptyState}>
						<span className={styles.emptyIcon}>📈</span>
						<h4>{t('no_rating_history', 'No rating history recorded yet for this mode')}</h4>
					</div>
				) : (
					<div className={styles.svgContainer}>
						{activePoint && (
							<div className={styles.tooltip}>
								<span className={styles.tooltipDate}>{activePoint.displayDate}</span>
								<div className={styles.tooltipRatingRow}>
									<span className={styles.tooltipRating}>{activePoint.rating}</span>
									{activePoint.delta !== null && activePoint.delta !== undefined && (
										<span
											className={`${styles.tooltipDelta} ${
												activePoint.delta > 0
													? styles.deltaPos
													: activePoint.delta < 0
													? styles.deltaNeg
													: styles.deltaZero
											}`}
										>
											{activePoint.delta > 0 ? `+${activePoint.delta}` : activePoint.delta}
										</span>
									)}
								</div>
								{activePoint.opponent && (
									<div className={styles.tooltipMatch}>
										<span className={styles.tooltipOpponent}>vs {activePoint.opponent}</span>
										{activePoint.result === 'win' && (
											<span className={styles.tooltipResultWin}>{t('win', 'WIN')}</span>
										)}
										{activePoint.result === 'loss' && (
											<span className={styles.tooltipResultLoss}>{t('loss', 'LOSS')}</span>
										)}
										{activePoint.result === 'draw' && (
											<span className={styles.tooltipResultDraw}>{t('draw', 'DRAW')}</span>
										)}
									</div>
								)}
							</div>
						)}

						<svg
							viewBox={`0 0 ${svgWidth} ${svgHeight}`}
							className={styles.chartSvg}
							onMouseMove={handleMouseMove}
							onMouseLeave={() => setHoveredIdx(null)}
						>
							<defs>
								<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={meta.color} stopOpacity="0.35" />
									<stop offset="100%" stopColor={meta.color} stopOpacity="0.0" />
								</linearGradient>
							</defs>

							{/* Horizontal gridlines & Y-axis labels */}
							{yTicks.map(tickVal => {
								const y = padTop + chartHeight - ((tickVal - minRating) / (maxRating - minRating || 1)) * chartHeight
								return (
									<g key={tickVal}>
										<line
											x1={padLeft}
											y1={y}
											x2={svgWidth - padRight}
											y2={y}
											className={styles.gridLine}
										/>
										<text
											x={padLeft - 10}
											y={y + 4}
											textAnchor="end"
											className={styles.axisText}
										>
											{tickVal}
										</text>
									</g>
								)
							})}

							{/* X-axis date labels */}
							{xTicks.map((pt, i) => (
								<text
									key={i}
									x={pt.svgX}
									y={svgHeight - 12}
									textAnchor="middle"
									className={styles.axisText}
								>
									{pt.displayDate}
								</text>
							))}

							{/* Filled gradient area */}
							{areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

							{/* Main line */}
							{lineD && (
								<path
									d={lineD}
									fill="none"
									stroke={meta.color}
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							)}

							{/* Data point dots */}
							{svgPoints.map((pt, idx) => (
								<circle
									key={idx}
									cx={pt.svgX}
									cy={pt.svgY}
									r={svgPoints.length > 25 ? '2.5' : '4'}
									fill={meta.color}
									stroke="#1E293B"
									strokeWidth="1.5"
								/>
							))}

							{/* Crosshair on hover */}
							{activePoint && (
								<g>
									<line
										x1={activePoint.svgX}
										y1={padTop}
										x2={activePoint.svgX}
										y2={padTop + chartHeight}
										className={styles.crosshairLine}
									/>
									<circle
										cx={activePoint.svgX}
										cy={activePoint.svgY}
										r="7"
										fill="none"
										stroke={meta.color}
										strokeWidth="2"
									/>
									<circle
										cx={activePoint.svgX}
										cy={activePoint.svgY}
										r="4"
										fill={meta.color}
									/>
								</g>
							)}
						</svg>
					</div>
				)}
			</div>
		</div>
	)
}

