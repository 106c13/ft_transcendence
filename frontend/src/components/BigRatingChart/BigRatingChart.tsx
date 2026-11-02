import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Brush,
} from 'recharts';
import { Trophy, TrendingDown, TrendingUp, Swords, Target, Check } from 'lucide-react';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import type {
	ModeRatingHistory,
	RatingCategory,
	AllTimeRatingPoint,
} from '../../hooks/useRatingHistory';
import styles from './BigRatingChart.module.css';

type TimeRange = '7d' | '30d' | '90d' | 'all';

type Props = {
	mode: RatingCategory;
	history?: ModeRatingHistory;
	activeModes?: RatingCategory[];
	ratingData?: Record<RatingCategory, ModeRatingHistory>;
	onToggleMode?: (mode: RatingCategory) => void;
};

const ALL_CATEGORIES: RatingCategory[] = ['bullet', 'blitz', 'rapid'];

const MODE_META: Record<
	RatingCategory,
	{ nameKey: string; timeKey: string; color: string }
> = {
	bullet: { nameKey: 'bullet_rating', timeKey: 'time_1_min', color: '#F59E0B' },
	blitz: { nameKey: 'blitz_rating', timeKey: 'time_3_min', color: '#38BDF8' },
	rapid: { nameKey: 'rapid_rating', timeKey: 'time_10_min', color: '#818CF8' },
};

type UnifiedChartPoint = {
	index: number;
	timestamp: number;
	date: string;
	displayDate: string;
	fullDateTime: string;
	eventMode?: RatingCategory;
	bullet?: number;
	blitz?: number;
	rapid?: number;
	bulletMeta?: AllTimeRatingPoint;
	blitzMeta?: AllTimeRatingPoint;
	rapidMeta?: AllTimeRatingPoint;
};

const BigRatingChart = ({
	mode,
	history,
	activeModes: propActiveModes,
	ratingData,
	onToggleMode,
}: Props) => {
	const { t } = useTranslation();
	const [timeRange, setTimeRange] = useState<TimeRange>('all');

	const getModeHistory = useCallback(
		(cat: RatingCategory): ModeRatingHistory | undefined => {
			if (ratingData && ratingData[cat]) return ratingData[cat];
			if (cat === mode) return history;
			return undefined;
		},
		[ratingData, mode, history]
	);

	const isModePlayable = useCallback(
		(cat: RatingCategory): boolean => {
			const h = getModeHistory(cat);
			if (!h) return false;
			const realMatches = h.allTime.filter((p) => p.id !== 'init');
			return h.gamesPlayed > 0 || realMatches.length > 0;
		},
		[getModeHistory]
	);

	// Only allow playable modes to be active on the chart
	const activeModes: RatingCategory[] = useMemo(() => {
		const candidate =
			propActiveModes && propActiveModes.length > 0 ? propActiveModes : [mode];
		const playableCandidate = candidate.filter((c) => isModePlayable(c));
		if (playableCandidate.length > 0) return playableCandidate;
		const firstPlayable = ALL_CATEGORIES.find((c) => isModePlayable(c));
		return firstPlayable ? [firstPlayable] : [];
	}, [propActiveModes, mode, isModePlayable]);

	const isSingleMode = activeModes.length === 1;
	const primaryMode = activeModes[0] || mode;

	// Summary stats calculation (supports both single mode and multi-mode selection)
	const summaryStats = useMemo(() => {
		if (activeModes.length === 0) {
			return {
				currentLabel: t('current_rating'),
				currentValue: '—',
				currentSub: t('not_played'),
				peakValue: '—',
				peakSub: t('all_time_high'),
				lowestValue: '—',
				lowestSub: t('all_time_low'),
				gamesValue: 0,
				gamesSub: `0${t('wins_short')} / 0${t('draws_short')} / 0${t('losses_short')}`,
				winRateValue: '0%',
				winRateSub: t('overall_success'),
			};
		}

		if (isSingleMode) {
			const h = getModeHistory(primaryMode);
			return {
				currentLabel: t('current_rating'),
				currentValue: h?.current ?? '—',
				currentSub: h?.isProvisional ? t('provisional') : t('calibrated'),
				peakValue: h?.peak ?? '—',
				peakSub: t('all_time_high'),
				lowestValue: h?.lowest ?? '—',
				lowestSub: t('all_time_low'),
				gamesValue: h?.gamesPlayed ?? 0,
				gamesSub: `${h?.wins ?? 0}${t('wins_short')} / ${h?.draws ?? 0}${t('draws_short')} / ${h?.losses ?? 0}${t('losses_short')}`,
				winRateValue: `${h?.winRate ?? 0}%`,
				winRateSub: t('overall_success'),
			};
		}

		// Multi-mode aggregate stats across active modes
		const histories = activeModes
			.map((m) => ({ mode: m, hist: getModeHistory(m) }))
			.filter((item): item is { mode: RatingCategory; hist: ModeRatingHistory } => !!item.hist);

		const bestCurrent = histories.reduce((best, curr) =>
			curr.hist.current > best.hist.current ? curr : best
		);
		const maxPeak = Math.max(...histories.map((h) => h.hist.peak));
		const minLowest = Math.min(...histories.map((h) => h.hist.lowest));
		const totalGames = histories.reduce((sum, h) => sum + h.hist.gamesPlayed, 0);
		const totalWins = histories.reduce((sum, h) => sum + h.hist.wins, 0);
		const totalDraws = histories.reduce((sum, h) => sum + h.hist.draws, 0);
		const totalLosses = histories.reduce((sum, h) => sum + h.hist.losses, 0);
		const combinedWinRate =
			totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

		return {
			currentLabel: t('highest_active'),
			currentValue: bestCurrent.hist.current,
			currentSub: `${t(MODE_META[bestCurrent.mode].nameKey)}`,
			peakValue: maxPeak,
			peakSub: t('peak_across_active'),
			lowestValue: minLowest,
			lowestSub: t('lowest_across_active'),
			gamesValue: totalGames,
			gamesSub: `${totalWins}${t('wins_short')} / ${totalDraws}${t('draws_short')} / ${totalLosses}${t('losses_short')}`,
			winRateValue: `${combinedWinRate}%`,
			winRateSub: t('avg_win_rate'),
		};
	}, [isSingleMode, primaryMode, activeModes, getModeHistory, t]);

	// Build unified timeline dataset across activeModes and filter by timeRange
	const chartData = useMemo(() => {
		if (activeModes.length === 0) return [];

		let refLatestMs = 0;
		for (const cat of activeModes) {
			const h = getModeHistory(cat);
			const realPts = (h?.allTime ?? []).filter((p) => p.id !== 'init');
			const lastPt = realPts[realPts.length - 1];
			if (lastPt) {
				const ts = lastPt.timestamp ?? new Date(lastPt.date).getTime();
				if (ts > refLatestMs) refLatestMs = ts;
			}
		}

		const cutoffMs =
			refLatestMs === 0
				? 0
				: timeRange === '7d'
				? refLatestMs - 7 * 24 * 60 * 60 * 1000
				: timeRange === '30d'
				? refLatestMs - 30 * 24 * 60 * 60 * 1000
				: timeRange === '90d'
				? refLatestMs - 90 * 24 * 60 * 60 * 1000
				: 0;

		if (isSingleMode) {
			const h = getModeHistory(primaryMode);
			// Exclude synthetic 'init' points so we only plot real played matches
			const rawPoints = (h?.allTime ?? []).filter((p) => p.id !== 'init');
			if (rawPoints.length === 0) return [];

			const filtered =
				cutoffMs > 0
					? rawPoints.filter((p) => {
							const ts = p.timestamp ?? new Date(p.date).getTime();
							return ts >= cutoffMs;
					  })
					: rawPoints;

			const sourcePoints = filtered.length > 0 ? filtered : rawPoints.slice(-1);

			const data: UnifiedChartPoint[] = sourcePoints.map((pt, idx) => ({
				index: idx,
				timestamp: pt.timestamp ?? new Date(pt.date).getTime(),
				date: pt.date,
				displayDate: pt.displayDate,
				fullDateTime: pt.fullDateTime || pt.displayDate,
				eventMode: primaryMode,
				[primaryMode]: pt.rating,
				[`${primaryMode}Meta`]: pt,
			}));

			// If only 1 match exists, duplicate a start anchor so AreaChart draws a clean line
			if (data.length === 1) {
				const single = data[0];
				const singleMeta = single[`${primaryMode}Meta` as 'bulletMeta' | 'blitzMeta' | 'rapidMeta'];
				const prevRating =
					singleMeta && typeof singleMeta.delta === 'number'
						? singleMeta.rating - singleMeta.delta
						: single[primaryMode] ?? 800;

				return [
					{
						index: 0,
						timestamp: single.timestamp - 60000,
						date: single.date,
						displayDate: t('start'),
						fullDateTime: t('start'),
						[primaryMode]: prevRating,
					},
					{
						...single,
						index: 1,
					},
				];
			}

			return data;
		}

		// Multi-mode timeline merge (only real played matches, never 'init' points)
		type RawEvent = {
			mode: RatingCategory;
			point: AllTimeRatingPoint;
			ts: number;
		};

		const allEvents: RawEvent[] = [];
		const initialRatings: Partial<Record<RatingCategory, number>> = {};

		for (const cat of activeModes) {
			const h = getModeHistory(cat);
			const realPts = (h?.allTime ?? []).filter((p) => p.id !== 'init');

			if (realPts.length > 0) {
				initialRatings[cat] = realPts[0].rating;
			}

			for (const p of realPts) {
				const ts = p.timestamp ?? new Date(p.date).getTime();
				if (cutoffMs === 0 || ts >= cutoffMs) {
					allEvents.push({ mode: cat, point: p, ts });
				}
			}
		}

		allEvents.sort((a, b) => a.ts - b.ts);

		if (allEvents.length === 0) return [];

		const runningRating: Partial<Record<RatingCategory, number>> = {
			...initialRatings,
		};

		const merged: UnifiedChartPoint[] = allEvents.map((ev, idx) => {
			runningRating[ev.mode] = ev.point.rating;
			const item: UnifiedChartPoint = {
				index: idx,
				timestamp: ev.ts,
				date: ev.point.date,
				displayDate: ev.point.displayDate,
				fullDateTime: ev.point.fullDateTime || ev.point.displayDate,
				eventMode: ev.mode,
			};
			for (const cat of activeModes) {
				if (runningRating[cat] !== undefined) {
					item[cat] = runningRating[cat];
				}
			}
			item[`${ev.mode}Meta` as 'bulletMeta' | 'blitzMeta' | 'rapidMeta'] = ev.point;
			return item;
		});

		if (merged.length === 1) {
			const single = merged[0];
			return [
				{ ...single, index: 0, displayDate: t('start') },
				{ ...single, index: 1 },
			];
		}

		return merged;
	}, [isSingleMode, primaryMode, activeModes, timeRange, getModeHistory, t]);

	// Compute Y-axis min and max bounds with padding
	const { minRating, maxRating } = useMemo(() => {
		const values: number[] = [];
		for (const row of chartData) {
			for (const cat of activeModes) {
				const v = row[cat];
				if (typeof v === 'number') values.push(v);
			}
		}

		if (values.length === 0) {
			return { minRating: 700, maxRating: 900 };
		}

		const rawMin = Math.min(...values);
		const rawMax = Math.max(...values);
		const diff = rawMax - rawMin;
		const step = diff <= 80 ? 20 : diff <= 250 ? 40 : 80;
		const pMin = Math.max(100, Math.floor((rawMin - step * 0.6) / 10) * 10);
		const pMax = Math.ceil((rawMax + step * 0.6) / 10) * 10;

		return {
			minRating: pMin,
			maxRating: pMax === pMin ? pMin + 100 : pMax,
		};
	}, [chartData, activeModes]);

	const timeRanges: { key: TimeRange; label: string }[] = [
		{ key: '7d', label: t('range_7d') },
		{ key: '30d', label: t('range_30d') },
		{ key: '90d', label: t('range_90d') },
		{ key: 'all', label: t('range_all') },
	];

	return (
		<div className={styles.bigChartWrapper}>
			{/* Top stats summary */}
			<div className={styles.statsGrid}>
				<div className={styles.statCard}>
					<span className={styles.statLabel}>
						<TrendingUp size={14} aria-hidden="true" />
						{summaryStats.currentLabel}
					</span>
					<span className={styles.statValue}>{summaryStats.currentValue}</span>
					<span className={styles.statSub}>{summaryStats.currentSub}</span>
				</div>

				<div className={styles.statCard}>
					<span className={styles.statLabel}>
						<Trophy size={14} aria-hidden="true" />
						{t('peak_rating')}
					</span>
					<span className={styles.statValue}>{summaryStats.peakValue}</span>
					<span className={styles.statSub}>{summaryStats.peakSub}</span>
				</div>

				<div className={styles.statCard}>
					<span className={styles.statLabel}>
						<TrendingDown size={14} aria-hidden="true" />
						{t('lowest_rating')}
					</span>
					<span className={styles.statValue}>{summaryStats.lowestValue}</span>
					<span className={styles.statSub}>{summaryStats.lowestSub}</span>
				</div>

				<div className={styles.statCard}>
					<span className={styles.statLabel}>
						<Swords size={14} aria-hidden="true" />
						{isSingleMode ? t('total_games') : t('combined_games')}
					</span>
					<span className={styles.statValue}>{summaryStats.gamesValue}</span>
					<span className={styles.statSub}>{summaryStats.gamesSub}</span>
				</div>

				<div className={styles.statCard}>
					<span className={styles.statLabel}>
						<Target size={14} aria-hidden="true" />
						{t('win_rate')}
					</span>
					<span className={styles.statValue}>{summaryStats.winRateValue}</span>
					<span className={styles.statSub}>{summaryStats.winRateSub}</span>
				</div>
			</div>

			{/* Big chart card */}
			<div className={styles.chartCard}>
				{/* Interactive Toggleable Mode Legends + Time Range Controls */}
				<div className={styles.chartHeader}>
					<div className={styles.legendPills} role="group" aria-label={t('active_modes')}>
						{ALL_CATEGORIES.map((cat) => {
							const meta = MODE_META[cat];
							const catHist = getModeHistory(cat);
							const playable = isModePlayable(cat);
							const isSelected = playable && activeModes.includes(cat);
							const currentRating =
								playable && catHist
									? catHist.isProvisional
										? `~${catHist.current}`
										: `${catHist.current}`
									: '—';

							return (
								<button
									key={cat}
									type="button"
									disabled={!playable}
									className={`${styles.legendToggleBtn} ${
										!playable
											? styles.legendToggleDisabled
											: isSelected
											? styles.legendToggleActive
											: styles.legendToggleInactive
									}`}
									style={
										{
											'--mode-color': meta.color,
										} as React.CSSProperties
									}
									onClick={() => playable && onToggleMode?.(cat)}
									aria-pressed={isSelected}
									title={
										!playable
											? `${t(meta.nameKey)} — ${t('not_played')}`
											: t(meta.nameKey)
									}
								>
									<span
										className={styles.legendCheckIndicator}
										style={{
											backgroundColor: isSelected ? meta.color : 'transparent',
											borderColor: isSelected
												? meta.color
												: 'rgba(148, 163, 184, 0.3)',
										}}
									>
										{isSelected && <Check size={10} strokeWidth={3.5} color="#0F172A" />}
									</span>

									<span className={styles.legendIconWrap}>
										<GameModeIcon mode={cat} size={16} />
									</span>

									<span className={styles.legendModeName}>{t(meta.nameKey)}</span>

									<span className={styles.legendRatingBadge}>{currentRating}</span>
								</button>
							);
						})}
					</div>

					<div className={styles.rangeFilterGroup} role="group">
						{timeRanges.map((r) => (
							<button
								key={r.key}
								type="button"
								className={`${styles.rangeBtn} ${
									timeRange === r.key ? styles.rangeBtnActive : ''
								}`}
								onClick={() => setTimeRange(r.key)}
							>
								{r.label}
							</button>
						))}
					</div>
				</div>

				{/* Recharts Responsive AreaChart or Empty State */}
				{chartData.length === 0 ? (
					<div className={styles.emptyState}>
						<TrendingUp size={36} className={styles.emptyIcon} aria-hidden="true" />
						<h4>{t('no_rating_history')}</h4>
					</div>
				) : (
					<div className={styles.rechartsContainer}>
						<ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={260}>
							<AreaChart
								data={chartData}
								margin={{ top: 18, right: 20, left: 0, bottom: 10 }}
							>
								<defs>
									{ALL_CATEGORIES.map((cat) => (
										<linearGradient
											key={cat}
											id={`big-recharts-grad-${cat}`}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="0%"
												stopColor={MODE_META[cat].color}
												stopOpacity={isSingleMode ? 0.38 : 0.22}
											/>
											<stop
												offset="95%"
												stopColor={MODE_META[cat].color}
												stopOpacity={0.0}
											/>
										</linearGradient>
									))}
								</defs>

								<CartesianGrid
									strokeDasharray="4 4"
									vertical={false}
									stroke="rgba(148, 163, 184, 0.1)"
								/>

								<XAxis
									dataKey="index"
									tickFormatter={(val: number) => chartData[val]?.displayDate ?? ''}
									stroke="#64748B"
									tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'var(--mono, monospace)' }}
									tickLine={false}
									axisLine={{ stroke: 'rgba(148, 163, 184, 0.14)' }}
									minTickGap={32}
									dy={8}
								/>

								<YAxis
									domain={[minRating, maxRating]}
									stroke="#64748B"
									tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'var(--mono, monospace)' }}
									tickLine={false}
									axisLine={false}
									width={46}
								/>

								<Tooltip
									isAnimationActive={false}
									cursor={{
										stroke: 'rgba(148, 163, 184, 0.35)',
										strokeWidth: 1.5,
										strokeDasharray: '4 4',
									}}
									content={({ active, payload }) => {
										if (!active || !payload || !payload.length) return null;
										const row = payload[0].payload as UnifiedChartPoint;

										return (
											<div className={styles.customTooltip}>
												<div className={styles.tooltipModesList}>
													{activeModes.map((cat) => {
														const val = row[cat];
														if (val === undefined) return null;
														const modeInfo = MODE_META[cat];

														return (
															<div key={cat} className={styles.tooltipModeBlock}>
																<div className={styles.tooltipRatingRow}>
																	<div className={styles.tooltipModeHeader}>
																		<span
																			className={styles.tooltipColorDot}
																			style={{ backgroundColor: modeInfo.color }}
																		/>
																		<span className={styles.tooltipModeLabel}>
																			{t(modeInfo.nameKey)}
																		</span>
																	</div>

																	<span className={styles.tooltipRating}>
																		{val}
																	</span>
																</div>
															</div>
														);
													})}
												</div>
											</div>
										);
									}}
								/>

								{activeModes.map((cat) => {
									const meta = MODE_META[cat];
									const metaKey = `${cat}Meta` as 'bulletMeta' | 'blitzMeta' | 'rapidMeta';

									return (
										<Area
											key={cat}
											type="monotone"
											dataKey={cat}
											stroke={meta.color}
											strokeWidth={3}
											fill={`url(#big-recharts-grad-${cat})`}
											connectNulls
											isAnimationActive={true}
											animationDuration={500}
											animationEasing="ease-out"
											dot={(dotProps: {
												cx?: number;
												cy?: number;
												index?: number;
												payload?: UnifiedChartPoint;
											}) => {
												const { cx, cy, index = 0, payload } = dotProps;
												if (
													chartData.length > 35 ||
													cx == null ||
													cy == null ||
													!payload
												) {
													return <g key={`${cat}-dot-empty-${index}`} />;
												}
												const ptMeta = payload[metaKey];
												if (!ptMeta) {
													return <g key={`${cat}-dot-none-${index}`} />;
												}
												return (
													<circle
														key={`${cat}-dot-${index}`}
														cx={cx}
														cy={cy}
														r={3.5}
														fill={meta.color}
														stroke="#0F172A"
														strokeWidth={1.5}
													/>
												);
											}}
											activeDot={(dotProps: {
												cx?: number;
												cy?: number;
												index?: number;
												payload?: UnifiedChartPoint;
											}) => {
												const { cx, cy, index = 0, payload } = dotProps;
												if (cx == null || cy == null || !payload) {
													return <g key={`${cat}-act-empty-${index}`} />;
												}
												const ptMeta = payload[metaKey];
												if (!ptMeta || ptMeta.id === 'init') {
													return <g key={`${cat}-act-none-${index}`} />;
												}
												return (
													<g key={`${cat}-act-${index}`}>
														<circle
															cx={cx}
															cy={cy}
															r={7}
															fill={meta.color}
															fillOpacity={0.28}
														/>
														<circle
															cx={cx}
															cy={cy}
															r={5}
															fill={meta.color}
															stroke="#0F172A"
															strokeWidth={2}
														/>
													</g>
												);
											}}
										/>
									);
								})}

								{chartData.length > 15 && (
									<Brush
										dataKey="index"
										tickFormatter={(val: number) => chartData[val]?.displayDate ?? ''}
										height={24}
										stroke="#475569"
										fill="#0F172A"
										travellerWidth={8}
									/>
								)}
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</div>
		</div>
	);
};

export default BigRatingChart;
