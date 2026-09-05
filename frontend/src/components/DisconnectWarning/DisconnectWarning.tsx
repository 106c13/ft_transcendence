import { useTranslation } from 'react-i18next'
import styles from './DisconnectWarning.module.css'

type Props = {
	pauseCountdown: number | null
}

function DisconnectWarning({ pauseCountdown }: Props) {
	const { t } = useTranslation()

	return (
		<div className={styles.gamePauseWarning}>
			<h4>⚠️ {t('opponent_disconnected_title', 'Opponent Disconnected')}</h4>
			<p>{t('opponent_reconnect_wait', 'Waiting for reconnection...')} {pauseCountdown}s</p>
		</div>
	)
}

export default DisconnectWarning