import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, SlidersHorizontal, ArrowDown, ArrowUp, Circle } from 'lucide-react';
import CustomSelect from '../CustomSelect/CustomSelect';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import type { SelectOption } from '../../utils/selectUtils';
import styles from '../../pages/LeaderboardPage/LeaderboardPage.module.css';


interface LeaderboardToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
	debouncedSearch: string;
	mode: 'all' | 'bullet' | 'blitz' | 'rapid';
	onModeChange: (mode: 'all' | 'bullet' | 'blitz' | 'rapid') => void;
	showFilters: boolean;
	onToggleFilters: () => void;
	activeFilterCount: number;
	minWinRate: number;
	onMinWinRateChange: (rate: number) => void;
	status: 'all' | 'online' | 'ingame';
	onStatusChange: (status: 'all' | 'online' | 'ingame') => void;
	sortBy: string;
	onSortByChange: (sort: string) => void;
	order: 'asc' | 'desc';
	onOrderChange: (order: 'asc' | 'desc') => void;
	onResetFilters: () => void;
}

const LeaderboardToolbar = ({
	search,
	onSearchChange,
	debouncedSearch,
	mode,
	onModeChange,
	showFilters,
	onToggleFilters,
	activeFilterCount,
	minWinRate,
	onMinWinRateChange,
	status,
	onStatusChange,
	sortBy,
	onSortByChange,
	order,
	onOrderChange,
	onResetFilters,
}: LeaderboardToolbarProps) => {
	const { t } = useTranslation();

	const winRateOptions: SelectOption<string>[] = useMemo(
		() => [
			{ value: '0', label: t('any_win_rate') },
			{ value: '40', label: '40%+' },
			{ value: '50', label: '50%+' },
			{ value: '60', label: '60%+' },
			{ value: '70', label: '70%+' },
		],
		[t]
	);

	const statusOptions: SelectOption<'all' | 'online' | 'ingame'>[] = useMemo(
		() => [
			{ value: 'all', label: t('all_players') },
			{
				value: 'online',
				label: t('online_only'),
				icon: <Circle size={8} fill="#22c55e" stroke="none" aria-hidden="true" />,
			},
			{
				value: 'ingame',
				label: t('in_game_only'),
				icon: <Circle size={8} fill="#a855f7" stroke="none" aria-hidden="true" />,
			},
		],
		[t]
	);

	const sortOptions: SelectOption<string>[] = useMemo(
		() => [
			{ value: 'leaderboardRating', label: t('leaderboard_rating') },
			{ value: 'highestRating', label: t('peak_elo') },
			{ value: 'winRate', label: t('winrate') },
			{ value: 'wins', label: t('total_wins') },
			{ value: 'bullet', label: t('bullet_rating') },
			{ value: 'blitz', label: t('blitz_rating') },
			{ value: 'rapid', label: t('rapid_rating') },
			{ value: 'username', label: t('username') },
		],
		[t]
	);

	const orderOptions: SelectOption<'asc' | 'desc'>[] = useMemo(
		() => [
			{
				value: 'desc',
				label: t('highest_first'),
				icon: <ArrowDown size={14} aria-hidden="true" />,
			},
			{
				value: 'asc',
				label: t('lowest_first'),
				icon: <ArrowUp size={14} aria-hidden="true" />,
			},
		],
		[t]
	);

	return (
		<div className={styles.toolbarCard}>
			<div className={styles.primaryControlsRow}>
				{/* Search Bar */}
				<div className={styles.searchBox}>
					<Search size={16} className={styles.searchIcon} aria-hidden="true" />
					<input
						type="text"
						placeholder={t('search_player_placeholder')}
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className={styles.searchInput}
					/>
					{search && (
						<button
							className={styles.clearSearchBtn}
							onClick={() => onSearchChange('')}
							type="button"
							aria-label="Clear search"
						>
							<X size={14} aria-hidden="true" />
						</button>
					)}
				</div>

				{/* Game Mode Filters */}
				<div className={styles.modeButtonGroup}>
					<button
						className={`${styles.modeBtn} ${mode === 'all' ? styles.modeBtnActive : ''}`}
						onClick={(e) => {
							e.currentTarget.blur();
							onModeChange('all');
						}}
						type="button"
					>
						<span>{t('all_formats')}</span>
					</button>
					<button
						className={`${styles.modeBtn} ${mode === 'bullet' ? styles.modeBtnActive : ''}`}
						onClick={(e) => {
							e.currentTarget.blur();
							onModeChange('bullet');
						}}
						type="button"
					>
						<span className={styles.modeBtnIcon}>
							<GameModeIcon mode="bullet" size={14} />
						</span>
						<span>{t('bullet')}</span>
					</button>
					<button
						className={`${styles.modeBtn} ${mode === 'blitz' ? styles.modeBtnActive : ''}`}
						onClick={(e) => {
							e.currentTarget.blur();
							onModeChange('blitz');
						}}
						type="button"
					>
						<span className={styles.modeBtnIcon}>
							<GameModeIcon mode="blitz" size={14} />
						</span>
						<span>{t('blitz')}</span>
					</button>
					<button
						className={`${styles.modeBtn} ${mode === 'rapid' ? styles.modeBtnActive : ''}`}
						onClick={(e) => {
							e.currentTarget.blur();
							onModeChange('rapid');
						}}
						type="button"
					>
						<span className={styles.modeBtnIcon}>
							<GameModeIcon mode="rapid" size={14} />
						</span>
						<span>{t('rapid')}</span>
					</button>
				</div>

				{/* Filter Toggle Button */}
				<button
					className={`${styles.filterToggleBtn} ${showFilters ? styles.filterToggleBtnActive : ''}`}
					onClick={(e) => {
						e.currentTarget.blur();
						onToggleFilters();
					}}
					type="button"
				>
					<SlidersHorizontal size={14} aria-hidden="true" />
					<span>{t('filters')}</span>
					{activeFilterCount > 0 && (
						<span className={styles.filterBadgeCount}>{activeFilterCount}</span>
					)}
				</button>
			</div>

			{/* Expandable Advanced Filters Drawer with CustomSelect and Reset in same row */}
			<div className={`${styles.drawerWrapper} ${showFilters ? styles.drawerOpen : ''}`}>
				<div className={styles.drawerInner}>
					<div className={styles.advancedDrawer}>
						<div className={styles.drawerRow}>
							<div className={styles.drawerFiltersGroup}>
								{/* Min Win Rate */}
								<div className={styles.filterField}>
									<label className={styles.filterLabel}>{t('min_win_rate')}</label>
									<CustomSelect<string>
										value={String(minWinRate)}
										options={winRateOptions}
										onChange={(val) => onMinWinRateChange(Number(val))}
									/>
								</div>

								{/* Activity / Online Status */}
								<div className={styles.filterField}>
									<label className={styles.filterLabel}>{t('status')}</label>
									<CustomSelect<'all' | 'online' | 'ingame'>
										value={status}
										options={statusOptions}
										onChange={onStatusChange}
									/>
								</div>

								{/* Sort Field */}
								<div className={styles.filterField}>
									<label className={styles.filterLabel}>{t('sort_by')}</label>
									<CustomSelect<string>
										value={sortBy}
										options={sortOptions}
										onChange={onSortByChange}
									/>
								</div>

								{/* Order */}
								<div className={styles.filterField}>
									<label className={styles.filterLabel}>{t('sort_direction')}</label>
									<CustomSelect<'asc' | 'desc'>
										value={order}
										options={orderOptions}
										onChange={onOrderChange}
									/>
								</div>
							</div>

							{/* Reset Filters on the same row on the right side */}
							<button
								className={styles.resetBtn}
								onClick={(e) => {
									e.currentTarget.blur();
									onResetFilters();
								}}
								type="button"
							>
								↺ {t('reset_all_filters')}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Active Filter Chips with smooth animation */}
			<div className={`${styles.chipsWrapper} ${activeFilterCount > 0 ? styles.hasChips : ''}`}>
				<div className={styles.chipsInner}>
					<div className={styles.activeChipsRow}>
						{debouncedSearch && (
							<span className={styles.activeChip}>
								User: {debouncedSearch}
								<button
									className={styles.chipCloseBtn}
									onClick={(e) => {
										e.currentTarget.blur();
										onSearchChange('');
									}}
									type="button"
									aria-label="Remove search filter"
								>
									<X size={12} aria-hidden="true" />
								</button>
							</span>
						)}
						{mode !== 'all' && (
							<span className={styles.activeChip}>
								Mode: {mode.toUpperCase()}
								<button
									className={styles.chipCloseBtn}
									onClick={(e) => {
										e.currentTarget.blur();
										onModeChange('all');
									}}
									type="button"
									aria-label="Remove mode filter"
								>
									<X size={12} aria-hidden="true" />
								</button>
							</span>
						)}
						{minWinRate > 0 && (
							<span className={styles.activeChip}>
								WR: ≥{minWinRate}%
								<button
									className={styles.chipCloseBtn}
									onClick={(e) => {
										e.currentTarget.blur();
										onMinWinRateChange(0);
									}}
									type="button"
									aria-label="Remove win rate filter"
								>
									<X size={12} aria-hidden="true" />
								</button>
							</span>
						)}
						{status !== 'all' && (
							<span className={styles.activeChip}>
								Status: {status}
								<button
									className={styles.chipCloseBtn}
									onClick={(e) => {
										e.currentTarget.blur();
										onStatusChange('all');
									}}
									type="button"
									aria-label="Remove status filter"
								>
									<X size={12} aria-hidden="true" />
								</button>
							</span>
						)}
						{(sortBy !== 'leaderboardRating' || order !== 'desc') && (
							<span className={styles.activeChip}>
								Sort: {sortBy === 'highestRating' ? 'Peak Elo' : sortBy} ({order})
								<button
									className={styles.chipCloseBtn}
									onClick={(e) => {
										e.currentTarget.blur();
										onSortByChange('leaderboardRating');
										onOrderChange('desc');
									}}
									type="button"
									aria-label="Remove sort filter"
								>
									<X size={12} aria-hidden="true" />
								</button>
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default LeaderboardToolbar;
