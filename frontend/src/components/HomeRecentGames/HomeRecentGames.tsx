import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { MatchRecord } from '../../utils/gameUtils';
import GameRow from '../GameRow/GameRow'
import styles from './HomeRecentGames.module.css'

type Props = {
	matches: MatchRecord[]
	username: string
	loading?: boolean
}

export default function HomeRecentGames({ matches, username, loading }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const recentMatches = matches.slice(0, 6)

	const handleSelectGame = (match: MatchRecord) => {
		navigate(`/game/analysis/${match.id}`, {
			state: { match, fromUsername: username },
		})
	}

	const handleSeeAll = () => {
		navigate(`/profile/${username}`, { state: { defaultTab: 'games' } })
	}

	return (
		<div className={styles.recentGamesCard}>
			<div className={styles.header}>
				<div className={styles.titleGroup}>
					<h3 className={styles.cardTitle}>{t('recent_games')}</h3>
					<span className={styles.countBadge}>{matches.length}</span>
				</div>

				{matches.length > 0 && (
					<button className={styles.seeAllBtn} onClick={handleSeeAll} type="button">
						{t('see_all')} →
					</button>
				)}
			</div>

			{loading ? (
				<div className={styles.emptyState}>
					<span className={styles.spinnerIcon}>♟</span>
					<p>{t('loading')}</p>
				</div>
			) : recentMatches.length === 0 ? (
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>♟️</div>
					<p className={styles.emptyText}>{t('no_games_yet')}</p>
					<p className={styles.emptySub}>{t('play_a_game_hint')}</p>
				</div>
			) : (
				<div className={styles.gamesListRows}>
					<div className={styles.listHeader}>
						<span>{t('mode')}</span>
						<span>{t('players')}</span>
						<span>{t('moves')}</span>
						<span>{t('result')}</span>
						<span>{t('review')}</span>
						<span>{t('date')}</span>
					</div>

					<div className={styles.rowsContainer}>
						{recentMatches.map((match) => (
							<GameRow
								key={match.id}
								match={match}
								username={username}
								onSelect={handleSelectGame}
								onRowClick={(m) => navigate(`/game/${m.id}`)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

