import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, SlidersHorizontal, ArrowDown, ArrowUp, Circle, RotateCcw } from 'lucide-react';
import CustomSelect from '../CustomSelect/CustomSelect';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import type { SelectOption } from '../../utils/selectUtils';
import styles from './LeaderboardToolbar.module.css';


interface LeaderboardToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
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

	const modeTabs: {
		value: 'all' | 'bullet' | 'blitz' | 'rapid';
		label: string;
		icon?: boolean;
	}[] = useMemo(
		() => [
			{ value: 'all', label: t('all_formats') },
			{ value: 'bullet', label: t('bullet_rating'), icon: true },
			{ value: 'blitz', label: t('blitz_rating'), icon: true },
			{ value: 'rapid', label: t('rapid_rating'), icon: true },
		],
		[t]
	);

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

	const hasAnyActiveFilter = Boolean(search.trim()) || mode !== 'all' || activeFilterCount > 0;

	return (
		<div className={styles.toolbarCard}>
			<div className={`${styles.primaryControlsRow} ${showFilters ? styles.primaryControlsRowOpen : ''}`}>
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
							aria-label={t('clear')}
						>
							<X size={14} aria-hidden="true" />
						</button>
					)}
				</div>

				<div className={styles.modeButtonGroup}>
					{modeTabs.map((tab) => (
						<button
							key={tab.value}
							className={`${styles.modeBtn} ${mode === tab.value ? styles.modeBtnActive : ''}`}
							onClick={(e) => {
								e.currentTarget.blur();
								onModeChange(tab.value);
							}}
							type="button"
						>
							{tab.icon && (
								<span className={styles.modeBtnIcon}>
									<GameModeIcon mode={tab.value} size={14} />
								</span>
							)}
							<span>{tab.label}</span>
						</button>
					))}
				</div>

				<button
					className={`${styles.filterToggleBtn} ${showFilters ? styles.filterToggleBtnActive : ''}`}
					onClick={(e) => {
						e.currentTarget.blur();
						onToggleFilters();
					}}
					type="button"
					aria-expanded={showFilters}
				>
					<SlidersHorizontal size={14} aria-hidden="true" />
					<span>{t('filters')}</span>
					{activeFilterCount > 0 && (
						<span className={styles.filterBadgeCount}>{activeFilterCount}</span>
					)}
				</button>
			</div>

			<div className={`${styles.drawerWrapper} ${showFilters ? styles.drawerOpen : ''}`}>
				<div className={styles.drawerInner}>
					<div className={styles.advancedDrawer}>
						<div className={styles.drawerFiltersGrid}>
							<div className={styles.filterField}>
								<label className={styles.filterLabel}>{t('min_win_rate')}</label>
								<CustomSelect<string>
									className={styles.filterSelect}
									minWidth={0}
									value={String(minWinRate)}
									options={winRateOptions}
									onChange={(val) => onMinWinRateChange(Number(val))}
								/>
							</div>

							<div className={styles.filterField}>
								<label className={styles.filterLabel}>{t('status')}</label>
								<CustomSelect<'all' | 'online' | 'ingame'>
									className={styles.filterSelect}
									minWidth={0}
									value={status}
									options={statusOptions}
									onChange={onStatusChange}
								/>
							</div>

							<div className={styles.filterField}>
								<label className={styles.filterLabel}>{t('sort_by')}</label>
								<CustomSelect<string>
									className={styles.filterSelect}
									minWidth={0}
									value={sortBy}
									options={sortOptions}
									onChange={onSortByChange}
								/>
							</div>

							<div className={styles.filterField}>
								<label className={styles.filterLabel}>{t('sort_direction')}</label>
								<CustomSelect<'asc' | 'desc'>
									className={styles.filterSelect}
									minWidth={0}
									value={order}
									options={orderOptions}
									onChange={onOrderChange}
								/>
							</div>
						</div>

						<div className={styles.drawerFooter}>
							<button
								className={styles.resetBtn}
								onClick={(e) => {
									e.currentTarget.blur();
									onResetFilters();
								}}
								type="button"
								disabled={!hasAnyActiveFilter}
							>
								<RotateCcw size={14} aria-hidden="true" />
								<span>{t('reset_all_filters')}</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LeaderboardToolbar;
