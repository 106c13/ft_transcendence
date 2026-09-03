import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LayoutContextType } from '../../layouts/MainLayout'
import PlayerSearch from '../../components/PlayerSearch/PlayerSearch'
import GameModesGrid from '../../components/GameModesGrid/GameModesGrid'
import type { GameModeType, ModeItem } from '../../constants/gameModeConstats'
import styles from './HomePage.module.css'

const MODES: ModeItem[] = [
	{ id: 'bullet', emoji: '🔥', label: 'Bullet', time: '1 min', desc: 'Fast and explosive' },
	{ id: 'bullet+2', emoji: '🔥', label: 'Bullet', time: '1 | +2s', desc: 'Fast with increment', increment: '+2' },
	{ id: 'blitz', emoji: '⚡', label: 'Blitz', time: '3 min', desc: 'Standard rapid action' },
	{ id: 'blitz+2', emoji: '⚡', label: 'Blitz', time: '3 | +2s', desc: 'Blitz with increment', increment: '+2' },
	{ id: 'rapid', emoji: '⏳', label: 'Rapid', time: '10 min', desc: 'Strategic classical' },
	{ id: 'rapid+2', emoji: '⏳', label: 'Rapid', time: '10 | +2s', desc: 'Rapid with increment', increment: '+2' },
]

function HomePage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { currentUser } = useOutletContext<LayoutContextType>()

	const handlePlayMode = (mode: GameModeType) => {
		navigate(`/game?mode=${encodeURIComponent(mode)}`)
	}

	return (
		<div className={styles.homeContainer}>
			<main className={styles.mainContent}>
				<div className={styles.contentHeader}>
					<h1>{t('welcome', { username: currentUser?.username || 'Player' })}</h1>
					<p className={styles.contentSubtitle}>
						{t('home_subtitle', 'Select a game mode and jump straight into a match')}
					</p>
				</div>

				<PlayerSearch />

				<GameModesGrid modes={MODES} onSelectMode={handlePlayMode} />
			</main>
		</div>
	)
}

export default HomePage