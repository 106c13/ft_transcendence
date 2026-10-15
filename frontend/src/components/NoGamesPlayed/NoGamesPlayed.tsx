import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swords } from 'lucide-react';
import styles from './NoGamesPlayed.module.css';

type Props = {
    isOwnProfile: boolean;
};

const NoGamesPlayed = ({ isOwnProfile }: Props) => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    return (
        <div className={styles.emptyCard}>
            <Swords size={36} className={styles.emptyIcon} aria-hidden="true" />
            <h4 className={styles.emptyTitle}>{t('no_games_yet')}</h4>
            <p className={styles.emptySubtitle}>
                {isOwnProfile
                    ? t('play_first_game_prompt')
                    : t('user_no_games')}
            </p>
            {isOwnProfile && (
                <button className={styles.playNowBtn} onClick={() => navigate('/home')} type="button">
                    <span className={styles.playNowBtnIcon}>
                        <Swords size={15} aria-hidden="true" />
                    </span>
                    <span>
                        {t('play_now')}
                    </span>
                </button>
            )}
        </div>
    )
};

export default NoGamesPlayed;