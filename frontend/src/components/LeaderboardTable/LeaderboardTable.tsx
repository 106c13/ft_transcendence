import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import TopRankBadge from '../TopRankBadge/TopRankBadge';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import { getModeColor } from '../../utils/gameUtils';
import type { LeaderboardPlayer } from '../../utils/leaderboardUtils';
import styles from '../../pages/LeaderboardPage/LeaderboardPage.module.css';


interface LeaderboardTableProps {
	players: LeaderboardPlayer[];
	loading: boolean;
	sortBy: string;
	order: 'asc' | 'desc';
	onSort: (field: string) => void;
	onPlayerClick: (username: string) => void;
	onResetFilters: () => void;
}

const LeaderboardTable = ({
	players,
	loading,
	sortBy,
	order,
	onSort,
	onPlayerClick,
	onResetFilters,
}: LeaderboardTableProps) => {
	const { t } = useTranslation();

	const handleHeaderClick = (e: MouseEvent, field: string) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.currentTarget instanceof HTMLElement) {
			e.currentTarget.blur();
		}
		onSort(field);
	};

	return (
		<div className={styles.tableCard}>
			{loading && players.length === 0 ? (
				<div className={styles.loadingState}>
					<div className={styles.spinner} />
					<span>{t('loading_leaderboard')}</span>
				</div>
			) : players.length === 0 ? (
				<div className={styles.emptyState}>
					<Search size={36} className={styles.emptyIcon} aria-hidden="true" />
					<h3 className={styles.emptyTitle}>{t('no_players_found')}</h3>
					<p className={styles.emptyText}>
						{t('no_players_filter_desc')}
					</p>
					<button
						className={styles.resetBtn}
						onClick={onResetFilters}
						type="button"
					>
						{t('reset_filters')}
					</button>
				</div>
			) : (
				<div
					className={styles.tableResponsive}
					style={{ opacity: loading ? 0.65 : 1, transition: 'opacity 0.2s ease' }}
				>
					<table className={styles.table}>
						<thead>
							<tr>
								<th
									className={`${styles.sortableHeader} ${styles.rankCell}`}
									onClick={(e) => handleHeaderClick(e, 'leaderboardRating')}
								>
									{t('rank')}
								</th>
								<th
									className={styles.sortableHeader}
									onClick={(e) => handleHeaderClick(e, 'username')}
								>
									{t('player')}
									{sortBy === 'username' && (
										<span className={styles.sortArrow}>{order === 'asc' ? '▲' : '▼'}</span>
									)}
								</th>
								<th
									className={styles.sortableHeader}
									onClick={(e) => handleHeaderClick(e, 'leaderboardRating')}
								>
									{t('leaderboard_rating')}
									{sortBy === 'leaderboardRating' && (
										<span className={styles.sortArrow}>{order === 'asc' ? '▲' : '▼'}</span>
									)}
								</th>
								<th
									className={`${styles.sortableHeader} ${styles.highestCol}`}
									onClick={(e) => handleHeaderClick(e, 'highestRating')}
								>
									{t('peak_elo')}
									{sortBy === 'highestRating' && (
										<span className={styles.sortArrow}>{order === 'asc' ? '▲' : '▼'}</span>
									)}
								</th>
								<th className={styles.formatsCol}>
									{t('formats')}
								</th>
								<th
									className={`${styles.sortableHeader} ${styles.recordCol}`}
									onClick={(e) => handleHeaderClick(e, 'wins')}
								>
									{t('record_wdl')}
									{sortBy === 'wins' && (
										<span className={styles.sortArrow}>{order === 'asc' ? '▲' : '▼'}</span>
									)}
								</th>
								<th
									className={styles.sortableHeader}
									onClick={(e) => handleHeaderClick(e, 'winRate')}
								>
									{t('winrate')}
									{sortBy === 'winRate' && (
										<span className={styles.sortArrow}>{order === 'asc' ? '▲' : '▼'}</span>
									)}
								</th>
							</tr>
						</thead>
						<tbody>
							{players.map((player) => (
								<tr
									key={player.userId}
									className={styles.tableRow}
									onClick={() => onPlayerClick(player.username)}
								>
									{/* Rank Cell with top 3 badge */}
									<td className={styles.rankCell}>
										{player.rank <= 3 ? (
											<span className={styles.rankBadgePodium}>
												<TopRankBadge rank={player.rank} size="md" />
											</span>
										) : (
											<span className={styles.rankNumber}>#{player.rank}</span>
										)}
									</td>

									{/* Player Avatar & Username - Compact */}
									<td>
										<div className={styles.playerCell}>
											<div className={styles.avatarWrapper}>
												<img
													src={
														player.avatar && player.avatar !== 'default.jpg'
															? `/uploads/${player.avatar}`
															: '/assets/default.jpg'
													}
													alt={player.username}
													className={styles.playerAvatar}
													onError={(e) => {
														e.currentTarget.src = '/assets/default.jpg';
													}}
												/>
												<span
													className={`${styles.statusDot} ${
														player.status === 'INGAME'
															? styles.statusIngame
															: player.status === 'ONLINE'
															? styles.statusOnline
															: styles.statusOffline
													}`}
												/>
											</div>
											<div className={styles.playerInfoCol}>
												<span className={styles.playerName}>@{player.username}</span>
												<span className={styles.playerSubtitle}>
													{player.status === 'INGAME'
														? t('in_game')
														: player.status === 'ONLINE'
														? t('online')
														: t('offline')}
												</span>
											</div>
										</div>
									</td>

									{/* Leaderboard Rating with unique top 3 icon right beside rating */}
									<td className={styles.ratingCell}>
										<div className={styles.ratingDisplayWrapper}>
											<span className={styles.mainRatingValue}>
												{player.leaderboardRating}
											</span>
											{player.rank <= 3 && (
												<TopRankBadge rank={player.rank} size="sm" />
											)}
										</div>
									</td>

									{/* Peak Elo - exact format color used across the project, no postfix */}
									<td className={styles.highestCell}>
										<span
											className={styles.highestValue}
											style={{ color: getModeColor(player.highestRating.category) }}
											title={`${player.highestRating.category.toUpperCase()}: ${player.highestRating.rating}`}
										>
											{player.highestRating.rating}
										</span>
									</td>

									{/* Formats Breakdown */}
									<td className={styles.formatsCell}>
										<div className={styles.formatsPillsRow}>
											<span
												className={`${styles.formatMiniPill} ${
													!player.ratings.bullet ? styles.formatMiniPillUnrated : ''
												}`}
												title={`Bullet: ${player.ratings.bullet ? player.ratings.bullet.rating : 'Unrated'}`}
											>
												<GameModeIcon mode="bullet" size={12} />
												<span>{player.ratings.bullet ? player.ratings.bullet.rating : '—'}</span>
											</span>
											<span
												className={`${styles.formatMiniPill} ${
													!player.ratings.blitz ? styles.formatMiniPillUnrated : ''
												}`}
												title={`Blitz: ${player.ratings.blitz ? player.ratings.blitz.rating : 'Unrated'}`}
											>
												<GameModeIcon mode="blitz" size={12} />
												<span>{player.ratings.blitz ? player.ratings.blitz.rating : '—'}</span>
											</span>
											<span
												className={`${styles.formatMiniPill} ${
													!player.ratings.rapid ? styles.formatMiniPillUnrated : ''
												}`}
												title={`Rapid: ${player.ratings.rapid ? player.ratings.rapid.rating : 'Unrated'}`}
											>
												<GameModeIcon mode="rapid" size={12} />
												<span>{player.ratings.rapid ? player.ratings.rapid.rating : '—'}</span>
											</span>
										</div>
									</td>

									{/* Record (W / D / L) - slashes and exact w/d/l order */}
									<td className={styles.recordCell}>
										<span className={styles.recordText}>
											<span className={styles.winsCount}>{player.stats.wins}W</span>
											<span className={styles.slashDivider}>/</span>
											<span className={styles.drawsCount}>{player.stats.draws}D</span>
											<span className={styles.slashDivider}>/</span>
											<span className={styles.lossesCount}>{player.stats.losses}L</span>
										</span>
									</td>

									{/* Win Rate */}
									<td>
										<div className={styles.winRateWrapper}>
											<span className={styles.winRateText}>{player.stats.winRate}%</span>
											<div className={styles.winRateBarTrack}>
												<div
													className={styles.winRateBarFill}
													style={{ width: `${Math.min(100, Math.max(0, player.stats.winRate))}%` }}
												/>
											</div>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default LeaderboardTable;
