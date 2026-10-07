import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { MatchRecord } from '../../utils/gameUtils';
import GameRow from '../GameRow/GameRow';
import CustomSelect from '../CustomSelect/CustomSelect';
import type { SelectOption } from '../../utils/selectUtils';
import styles from './GamesList.module.css'

type Props = {
	matches: MatchRecord[]
	username: string
	isOwnProfile: boolean
	loading: boolean
	onSelectGame: (match: MatchRecord) => void
	getOutcome?: (match: MatchRecord) => { label: string; className: string }
	formatDate?: (dateStr: string) => string
	formatReason?: (reason: string) => string
}

const GAMES_PER_PAGE = 20

export default function GamesList({
	matches,
	username,
	isOwnProfile,
	loading,
	onSelectGame,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	// Filter states
	const [colorFilter, setColorFilter] = useState<'all' | 'white' | 'black'>('all')
	const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all')
	const [modeFilter, setModeFilter] = useState<'all' | 'bullet' | 'blitz' | 'rapid'>('all')
	const [currentPage, setCurrentPage] = useState(1)

	const handleColorChange = (val: 'all' | 'white' | 'black') => {
		setColorFilter(val)
		setCurrentPage(1)
	}

	const handleResultChange = (val: 'all' | 'win' | 'loss' | 'draw') => {
		setResultFilter(val)
		setCurrentPage(1)
	}

	const handleModeChange = (val: 'all' | 'bullet' | 'blitz' | 'rapid') => {
		setModeFilter(val)
		setCurrentPage(1)
	}

	// Filtered matches
	const filteredMatches = useMemo(() => {
		return matches.filter((match) => {
			const isWhite = match.white?.username === username
			const isBlack = match.black?.username === username

			// Color filter
			if (colorFilter === 'white' && !isWhite) return false
			if (colorFilter === 'black' && !isBlack) return false

			// Result filter
			if (resultFilter !== 'all') {
				let outcome: 'win' | 'loss' | 'draw' = 'draw'
				if (match.winner_id) {
					outcome =
						(isWhite && match.winner_id === match.white_id) ||
						(!isWhite && match.winner_id === match.black_id)
							? 'win'
							: 'loss'
				}
				if (outcome !== resultFilter) return false
			}

			// Mode filter
			if (modeFilter !== 'all') {
				const rawMode = match.mode.toLowerCase()
				if (!rawMode.startsWith(modeFilter)) return false
			}

			return true
		})
	}, [matches, username, colorFilter, resultFilter, modeFilter])

	// Pagination calculations
	const totalGames = filteredMatches.length
	const totalPages = Math.max(1, Math.ceil(totalGames / GAMES_PER_PAGE))
	const safePage = Math.min(currentPage, totalPages)

	const paginatedMatches = useMemo(() => {
		const startIdx = (safePage - 1) * GAMES_PER_PAGE
		return filteredMatches.slice(startIdx, startIdx + GAMES_PER_PAGE)
	}, [filteredMatches, safePage])

	const fromIndex = totalGames > 0 ? (safePage - 1) * GAMES_PER_PAGE + 1 : 0
	const toIndex = Math.min(safePage * GAMES_PER_PAGE, totalGames)

	const hasActiveFilters =
		colorFilter !== 'all' || resultFilter !== 'all' || modeFilter !== 'all'

	const handleResetFilters = () => {
		setColorFilter('all')
		setResultFilter('all')
		setModeFilter('all')
	}

	if (loading) {
		return (
			<div className={styles.container}>
				<div className={styles.loadingSpinner}>
					<span className={styles.spinnerIcon}>♟</span>
					<p>{t('loading')}</p>
				</div>
			</div>
		)
	}

	if (matches.length === 0) {
		return (
			<div className={styles.container}>
				<div className={styles.emptyCard}>
					<div className={styles.emptyIcon}>♟️</div>
					<h4 className={styles.emptyTitle}>{t('no_games_yet')}</h4>
					<p className={styles.emptySubtitle}>
						{isOwnProfile
							? t('play_first_game_prompt')
							: t('user_no_games')}
					</p>
					{isOwnProfile && (
						<button className={styles.playNowBtn} onClick={() => navigate('/home')} type="button">
							⚔️ {t('play_now')}
						</button>
					)}
				</div>
			</div>
		)
	}

	const colorOptions: SelectOption<'all' | 'white' | 'black'>[] = [
		{ value: 'all', label: t('all_colors') },
		{ value: 'white', label: t('white') },
		{ value: 'black', label: t('black') },
	]

	const resultOptions: SelectOption<'all' | 'win' | 'loss' | 'draw'>[] = [
		{ value: 'all', label: t('all_results') },
		{ value: 'win', label: t('wins') },
		{ value: 'loss', label: t('losses') },
		{ value: 'draw', label: t('draws') },
	]

	const modeOptions: SelectOption<'all' | 'bullet' | 'blitz' | 'rapid'>[] = [
		{ value: 'all', label: t('all_modes') },
		{ value: 'bullet', icon: '🔥', label: t('bullet_rating') },
		{ value: 'blitz', icon: '⚡', label: t('blitz_rating') },
		{ value: 'rapid', icon: '⏳', label: t('rapid_rating') },
	]

	return (
		<div className={styles.container}>
			{/* Top header */}
			<div className={styles.header}>
				<div className={styles.titleGroup}>
					<h3 className={styles.title}>{t('games')}</h3>
					<span className={styles.countBadge}>{matches.length}</span>
				</div>
			</div>

			{/* Filter Bar */}
			<div className={styles.filterBar}>
				{/* Color Filter */}
				<div className={styles.filterGroup}>
					<label className={styles.filterLabel}>{t('filter_color')}:</label>
					<CustomSelect<'all' | 'white' | 'black'>
						value={colorFilter}
						options={colorOptions}
						onChange={handleColorChange}
						minWidth={115}
					/>
				</div>

				{/* Result Filter */}
				<div className={styles.filterGroup}>
					<label className={styles.filterLabel}>{t('filter_result')}:</label>
					<CustomSelect<'all' | 'win' | 'loss' | 'draw'>
						value={resultFilter}
						options={resultOptions}
						onChange={handleResultChange}
						minWidth={115}
					/>
				</div>

				{/* Game Mode Filter */}
				<div className={styles.filterGroup}>
					<label className={styles.filterLabel}>{t('filter_mode')}:</label>
					<CustomSelect<'all' | 'bullet' | 'blitz' | 'rapid'>
						value={modeFilter}
						options={modeOptions}
						onChange={handleModeChange}
						minWidth={120}
					/>
				</div>

				{/* Reset Button */}
				{hasActiveFilters && (
					<button className={styles.resetBtn} onClick={handleResetFilters}>
						✕ {t('clear')}
					</button>
				)}
			</div>

			{/* Games List Content */}
			{totalGames === 0 ? (
				<div className={styles.emptyCard}>
					<div className={styles.emptyIcon}>🔍</div>
					<h4 className={styles.emptyTitle}>{t('no_games_matching_filter')}</h4>
					<p className={styles.emptySubtitle}>
						{t('try_adjusting_filters')}
					</p>
					<button className={styles.resetBtn} onClick={handleResetFilters} type="button">
						✕ {t('clear')}
					</button>
				</div>
			) : (
				<div className={styles.listContainer}>
					{/* Table Column Labels */}
					<div className={styles.listHeader}>
						<span>{t('mode')}</span>
						<span>{t('players')}</span>
						<span>{t('moves')}</span>
						<span>{t('result')}</span>
						<span>{t('review')}</span>
						<span>{t('date')}</span>
					</div>

					<div className={styles.rowsContainer}>
						{paginatedMatches.map((match) => (
							<GameRow
								key={match.id}
								match={match}
								username={username}
								onSelect={onSelectGame}
								onRowClick={(m) => navigate(`/game/${m.id}`)}
							/>
						))}
					</div>
				</div>
			)}

			{/* Pagination Controls (20 games per page) */}
			{totalGames > 0 && (
				<div className={styles.paginationBar}>
					<div className={styles.paginationInfo}>
						{t('showing_games', {
							from: fromIndex,
							to: toIndex,
							total: totalGames,
						})}
					</div>

					{totalPages > 1 && (
						<div className={styles.paginationControls}>
							<button
								className={styles.pageBtn}
								disabled={safePage <= 1}
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							>
								{t('previous')}
							</button>

							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((page) => {
									// Show first, last, and pages around current
									return (
										page === 1 ||
										page === totalPages ||
										Math.abs(page - safePage) <= 2
									);
								})
								.map((page, index, array) => {
									const prev = array[index - 1];
									const showEllipsis = prev && page - prev > 1;

									return (
										<span key={page} style={{ display: 'inline-flex', alignItems: 'center' }}>
											{showEllipsis && <span style={{ color: '#64748B', padding: '0 4px' }}>...</span>}
											<button
												className={`${styles.pageBtn} ${
													page === safePage ? styles.activePageBtn : ''
												}`}
												onClick={() => setCurrentPage(page)}
											>
												{page}
											</button>
										</span>
									);
								})}

							<button
								className={styles.pageBtn}
								disabled={safePage >= totalPages}
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							>
								{t('next')}
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
