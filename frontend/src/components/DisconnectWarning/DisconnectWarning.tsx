import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import styles from './DisconnectWarning.module.css';

type Props = {
	pauseCountdown: number | null;
};

const DisconnectWarning = ({ pauseCountdown }: Props) => {
	const { t } = useTranslation();

	return (
		<div className={styles.gamePauseWarning}>
			<h4>
				<AlertTriangle size={18} aria-hidden="true" />
				<span>{t('opponent_disconnected_title')}</span>
			</h4>
			<p>{t('opponent_reconnect_wait')} {pauseCountdown}s</p>
		</div>
	);
};

export default DisconnectWarning;