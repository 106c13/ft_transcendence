import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	YAxis,
	Tooltip,
	ReferenceLine,
} from 'recharts';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import type { ModeRatingHistory, RatingCategory } from '../../hooks/useRatingHistory';
import styles from './MiniRatingChart.module.css';

type Props = {
	mode: RatingCategory;
	history?: ModeRatingHistory;
	onClick: () => void;
	compact?: boolean;
};

const MODE_CONFIG: Record<
	RatingCategory,
	{ nameKey: string; time: string; color: string }
> = {
	bullet: {
		nameKey: 'bullet_rating',
		time: '1 min',
		color: '#F59E0B',
	},
	blitz: {
		nameKey: 'blitz_rating',
		time: '3 min',
		color: '#38BDF8',
	},
	rapid: {
		nameKey: 'rapid_rating',
		time: '10 min',
		color: '#818CF8',
	},
};

const CALIBRATION_STEPS = [0, 1, 2, 3, 4];

const MiniRatingChart = ({ mode, history, onClick, compact = false }: Props) => {
	const { t } = useTranslation();
	const config = MODE_CONFIG[mode];

	const isNotPlayed = !history || history.gamesPlayed === 0;
	const isProvisional = history?.isProvisional ?? true;
	const gamesPlayed = history?.gamesPlayed ?? 0;
	const current = history?.current ?? 800;

	const wins = history?.wins ?? 0;
	const draws = history?.draws ?? 0;
	const losses = history?.losses ?? 0;

	const points = useMemo(() => history?.last7Days ?? [], [history?.last7Days]);

	const { minVal, maxVal } = useMemo(() => {
		const ratings = points.map((p) => p.rating);
		const rawMin = ratings.length > 0 ? Math.min(...ratings) : 800;
		const rawMax = ratings.length > 0 ? Math.max(...ratings) : 800;
		const diff = rawMax - rawMin;
		const padRating = diff === 0 ? 30 : Math.max(15, diff * 0.2);
		return {
			minVal: Math.floor(rawMin - padRating),
			maxVal: Math.ceil(rawMax + padRating),
		};
	}, [points]);

	const strokeColor = config.color;
	const gradientId = `mini-grad-${mode}-${compact ? 'c' : 'f'}`;

	const renderSparkline = () => {
		if (isNotPlayed || isProvisional || points.length === 0) {
			if (compact) {
				return (
					<ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
						<AreaChart
							data={[
								{ label: '1', rating: 800 },
								{ label: '7', rating: 800 },
							]}
							margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
						>
							<YAxis domain={[750, 850]} hide />
							<ReferenceLine
								y={800}
								stroke="rgba(148, 163, 184, 0.25)"
								strokeWidth={1.5}
								strokeDasharray="4 4"
							/>
						</AreaChart>
					</ResponsiveContainer>
				);
			}

			const clampedGames = Math.min(5, Math.max(0, gamesPlayed));
			const remaining = Math.max(1, 5 - clampedGames);

			return (
				<div
					className={styles.calibrationEmptyState}
					style={{ '--mode-color': strokeColor } as React.CSSProperties}
				>
					<div className={styles.calibrationTopRow}>
						<span className={styles.calibrationHint}>
							{clampedGames === 0
								? t('play_5_to_calibrate')
								: t('play_more_to_calibrate', { count: remaining })}
						</span>
						<span className={styles.calibrationCount}>{clampedGames} / 5</span>
					</div>

					<div className={styles.calibrationTrack} aria-hidden="true">
						{CALIBRATION_STEPS.map((step) => (
							<span
								key={step}
								className={`${styles.calibrationSegment} ${
									step < clampedGames ? styles.calibrationSegmentFilled : ''
								}`}
							/>
						))}
					</div>
				</div>
			);
		}

		return (
			<ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
				<AreaChart
					data={points}
					margin={
						compact
							? { top: 4, right: 6, left: 6, bottom: 4 }
							: { top: 8, right: 8, left: 8, bottom: 8 }
					}
				>
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
							<stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
						</linearGradient>
					</defs>

					<YAxis domain={[minVal, maxVal]} hide />

					{!compact && (
						<Tooltip
							isAnimationActive={false}
							cursor={{
								stroke: 'rgba(148, 163, 184, 0.35)',
								strokeWidth: 1,
								strokeDasharray: '3 3',
							}}
							content={({ active, payload }) => {
								if (!active || !payload || !payload.length) return null;
								const pt = payload[0].payload as {
									label?: string;
									fullDate?: string;
									rating: number;
								};
								return (
									<div className={styles.miniTooltip}>
										<span className={styles.miniTooltipDate}>
											{pt.fullDate || pt.label}
										</span>
										<span
											className={styles.miniTooltipRating}
											style={{ color: strokeColor }}
										>
											{pt.rating}
										</span>
									</div>
								);
							}}
						/>
					)}

					<Area
						type="monotone"
						dataKey="rating"
						stroke={strokeColor}
						strokeWidth={2.4}
						fill={`url(#${gradientId})`}
						isAnimationActive={true}
						animationDuration={650}
						animationEasing="ease-out"
						dot={(dotProps: { cx?: number; cy?: number; index?: number }) => {
							const { cx, cy, index = 0 } = dotProps;
							if (cx == null || cy == null) return <g key={`empty-${index}`} />;
							const isLast = index === points.length - 1;
							if (compact) {
								if (!isLast) return <g key={`c-dot-${index}`} />;
								return (
									<circle
										key={`c-dot-${index}`}
										cx={cx}
										cy={cy}
										r={3}
										fill={strokeColor}
										stroke="#1E293B"
										strokeWidth={1.5}
									/>
								);
							}
							if (isLast) {
								return (
									<g key={`dot-${index}`}>
										<circle
											cx={cx}
											cy={cy}
											r={6}
											fill={strokeColor}
											fillOpacity={0.25}
										/>
										<circle
											cx={cx}
											cy={cy}
											r={3.5}
											fill={strokeColor}
											stroke="#1E293B"
											strokeWidth={1.5}
										/>
									</g>
								);
							}
							return (
								<circle
									key={`dot-${index}`}
									cx={cx}
									cy={cy}
									r={2.2}
									fill={strokeColor}
									stroke="#1E293B"
									strokeWidth={1.2}
								/>
							);
						}}
						activeDot={
							compact
								? false
								: {
										r: 4.5,
										fill: strokeColor,
										stroke: '#0F172A',
										strokeWidth: 2,
								  }
						}
					/>
				</AreaChart>
			</ResponsiveContainer>
		);
	};

	const handleCardClick = () => {
		if (isNotPlayed) return;
		onClick();
	};

	if (compact) {
		return (
			<div
				className={`${styles.miniChartCard} ${styles.compactCard} ${
					isNotPlayed ? styles.unplayedCard : ''
				}`}
				onClick={handleCardClick}
				role={isNotPlayed ? undefined : 'button'}
				tabIndex={isNotPlayed ? -1 : 0}
				onKeyDown={(e) => {
					if (!isNotPlayed && (e.key === 'Enter' || e.key === ' ')) {
						e.preventDefault();
						onClick();
					}
				}}
			>
				<div className={styles.compactRow}>
					<div className={styles.modeInfo}>
						<span className={styles.modeIcon}>
							<GameModeIcon mode={mode} size={16} />
						</span>
						<div className={styles.modeText}>
							<span className={styles.modeTitle}>{t(config.nameKey)}</span>
						</div>
					</div>

					<div className={styles.compactRecord}>
						<span className={styles.compactWins}>
							{wins}
							{t('wins_short')}
						</span>
						<span className={styles.compactSep}>/</span>
						<span className={styles.compactDraws}>
							{draws}
							{t('draws_short')}
						</span>
						<span className={styles.compactSep}>/</span>
						<span className={styles.compactLosses}>
							{losses}
							{t('losses_short')}
						</span>
					</div>

					<div className={styles.compactChartContainer}>{renderSparkline()}</div>

					<div className={styles.compactValueGroup}>
						<div
							className={`${styles.ratingNumber} ${
								isNotPlayed ? styles.ratingNumberUnrated : ''
							}`}
						>
							{isNotPlayed ? '—' : isProvisional ? `~${current}` : current}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`${styles.miniChartCard} ${isNotPlayed ? styles.unplayedCard : ''}`}
			onClick={handleCardClick}
			role={isNotPlayed ? undefined : 'button'}
			tabIndex={isNotPlayed ? -1 : 0}
			onKeyDown={(e) => {
				if (!isNotPlayed && (e.key === 'Enter' || e.key === ' ')) {
					e.preventDefault();
					onClick();
				}
			}}
		>
			<div className={styles.header}>
				<div className={styles.modeInfo}>
					<span className={styles.modeIcon}>
						<GameModeIcon mode={mode} size={20} />
					</span>
					<div className={styles.modeText}>
						<span className={styles.modeTitle}>{t(config.nameKey)}</span>
					</div>
				</div>

				<div
					className={`${styles.ratingNumber} ${
						isNotPlayed ? styles.ratingNumberUnrated : ''
					}`}
				>
					{isNotPlayed ? '—' : isProvisional ? `~${current}` : current}
				</div>
			</div>

			{/* 7-day Recharts sparkline or 0/5 Calibration Progress Bar */}
			<div className={styles.chartContainer}>{renderSparkline()}</div>
		</div>
	);
};

export default MiniRatingChart;
