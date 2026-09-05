import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { MatchRecord } from '../GameAnalysis/GameAnalysis'
import styles from './GamesList.module.css'

type Props = {
	matches: MatchRecord[]
	username: string
	isOwnProfile: boolean
	loading: boolean
	getOutcome: (match: MatchRecord) => { label: string; className: string }
	formatDate: (dateStr: string) => string
	formatReason: (reason: string) => string
	onSelectGame: (match: MatchRecord) => void
}

function GamesList({
	matches,
	username,
	isOwnProfile,
	loading,
	getOutcome,
	formatDate,
	formatReason,
	onSelectGame,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	if (loading) {
		return (
			<div className={styles.container}>
				<div className={styles.loadingSpinner}>
					<span className={styles.spinnerIcon}>♟</span>
					<p>{t('loading', 'Loading games...')}</p>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleGroup}>
					<h3 className={styles.title}>{t('games', 'Games')}</h3>
					<span className={styles.countBadge}>{matches.length}</span>
				</div>
				<p className={styles.subtitle}>
					{t('choose_game_to_analyze', 'Choose a game from history to analyze.')}
				</p>
			</div>

			{matches.length === 0 ? (
				<div className={styles.emptyCard}>
					<div className={styles.emptyIcon}>♟</div>
					<h4>{t('no_games_yet', 'No games played yet')}</h4>
					<p>
						{isOwnProfile
							? t('play_first_game_prompt', 'Play matches to build your game history and analysis log.')
							: t('user_no_games', 'This user has not played any games yet.')}
					</p>
					{isOwnProfile && (
						<button className={styles.playNowBtn} onClick={() => navigate('/home')}>
							⚔️ {t('play_now', 'Play Now')}
						</button>
					)}
				</div>
			) : (
				<div className={styles.grid}>
					{matches.map((match) => {
						const outcome = getOutcome(match)
						const isUserWhite = match.white?.username === username
						const opponent = isUserWhite ? match.black : match.white
						const userSide = isUserWhite ? 'White' : 'Black'

						return (
							<div
								key={match.id}
								className={styles.gameCard}
								onClick={() => onSelectGame(match)}
							>
								<div className={styles.cardTop}>
									<span className={`${styles.modeBadge} ${styles[`mode${match.mode.replace('+', 'Plus')}`] || ''}`}>
										{match.mode}
									</span>
									<span className={styles.date}>{formatDate(match.played_at)}</span>
								</div>

								<div className={styles.matchup}>
									<div className={styles.matchupPlayers}>
										<div className={styles.matchupRow}>
											<span className={`${styles.sideDot} ${styles.white}`}></span>
											<span className={`${styles.playerLabel} ${match.white?.username === username ? styles.bold : ''}`}>
												{match.white?.username || 'White'}
											</span>
											{match.winner_id === match.white_id && <span className={styles.winnerCrown}>👑</span>}
										</div>
										<div className={styles.matchupRow}>
											<span className={`${styles.sideDot} ${styles.black}`}></span>
											<span className={`${styles.playerLabel} ${match.black?.username === username ? styles.bold : ''}`}>
												{match.black?.username || 'Black'}
											</span>
											{match.winner_id === match.black_id && <span className={styles.winnerCrown}>👑</span>}
										</div>
									</div>

									<div className={styles.cardOutcome}>
										<span className={`${styles.outcomePill} ${styles[`outcome${outcome.className.charAt(0).toUpperCase() + outcome.className.slice(1)}`]}`}>
											{outcome.label}
										</span>
										<span className={styles.reasonText}>{formatReason(match.result)}</span>
									</div>
								</div>

								<div className={styles.cardFooter}>
									<span className={styles.userSideInfo}>
										{t('played_as', 'Played as')} <strong>{userSide}</strong> vs <strong>{opponent?.username || 'Opponent'}</strong>
									</span>
									<button
										className={styles.analyzeBtn}
										onClick={(e) => {
											e.stopPropagation()
											onSelectGame(match)
										}}
									>
										🔍 {t('analyze', 'Analyze')}
									</button>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

export default GamesList
