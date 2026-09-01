import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './GameActions.module.css'

type Props = {
	isGameOver: boolean
	onResign: () => void
}

function GameActions({ isGameOver, onResign }: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	return (
		<div className={styles.gameActions}>
			{isGameOver ? (
				<button
					className={styles.resignBtn}
					style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', borderColor: 'rgba(96, 165, 250, 0.4)' }}
					onClick={() => navigate('/home')}
				>
					🏠 {t('back_to_lobby', 'Back to Lobby')}
				</button>
			) : (
				<button className={styles.resignBtn} onClick={onResign}>
					🏳️ {t('resign', 'Resign')}
				</button>
			)}
		</div>
	)
}

export default GameActions
