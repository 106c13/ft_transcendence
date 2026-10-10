import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { useGameSocketContext } from '../../context/GameSocketContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getPieceImageSrc } from '../../utils/gameUtils';
import type { GameModeType } from '../../utils/gameModeUtils';
import type { LayoutContextType } from '../../layouts/MainLayout';
import styles from './MatchmakingPage.module.css';

const MatchmakingPage = () => {
    const { t } = useTranslation()
    usePageTitle('page_title_searching')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const modeParam = (searchParams.get('mode') || 'blitz') as GameModeType
    const { currentUser } = useOutletContext<LayoutContextType>()
    const currentUserId = currentUser?.id
    const { socket } = useGameSocketContext()
    const socketRef = useRef<Socket | null>(null)
    const matchFoundRef = useRef(false)

    // Matchmaking socket connection
    useEffect(() => {
        if (!currentUserId || !socket) return

        matchFoundRef.current = false
        socketRef.current = socket

        const onConnect = () => {
            socket.emit('find_match', { mode: modeParam })
        }

        const onMatchFound = (data: { gameId: string }) => {
            matchFoundRef.current = true
            navigate(`/game/${data.gameId}`)
        }

        socket.on('connect', onConnect)
        socket.on('match_found', onMatchFound)

        if (socket.connected) {
            socket.emit('find_match', { mode: modeParam })
        }

        return () => {
            socket.off('connect', onConnect)
            socket.off('match_found', onMatchFound)

            // Only cancel queue if unmounted without finding a match
            if (!matchFoundRef.current) {
                if (socket.connected) {
                    socket.emit('cancel_queue')
                }
            }
            socketRef.current = null
        }
    }, [socket, currentUserId, modeParam, navigate])

    const handleCancel = () => {
        const activeSocket = socketRef.current || socket
        if (activeSocket?.connected) {
            activeSocket.emit('cancel_queue')
        }
        navigate('/home')
    }

    const category = (modeParam.replace('+2', '') as 'bullet' | 'blitz' | 'rapid') || 'blitz'
    const userRatingInfo = currentUser?.ratings?.[category]
    const searchingRatingText = userRatingInfo
        ? (userRatingInfo.isProvisional ? `~${userRatingInfo.rating} (${t('provisional')})` : `${userRatingInfo.rating}`)
        : `~800 (${t('provisional')})`

    return (
        <div className={styles.pageContainer}>
            <main className={styles.mainContent}>
                <div className={styles.searchingCard}>
                    <div className={styles.visualContainer} aria-hidden="true">
                        <div className={styles.loaderRing} />
                        <div className={styles.pedestal}>
                            <div className={styles.pawnWrapper}>
                                <img
                                    src={getPieceImageSrc('p', 'w')}
                                    alt=""
                                    className={styles.pawnImage}
                                />
                                <div className={styles.pawnShadow} />
                            </div>
                        </div>
                    </div>
                    <h3>{t('searching_match')}</h3>
                    <p className={styles.searchingDesc}>
                        {t('searching_desc')}{' '}
                        <span className={styles.modeBadge}>{modeParam}</span>
                    </p>
                    <p className={styles.searchingRating}>
                        {t('your_rating')}: <strong>{searchingRatingText}</strong>
                    </p>
                    <button
                        type="button"
                        className={styles.cancelMatchBtn}
                        onClick={handleCancel}
                    >
                        <X size={15} aria-hidden="true" />
                        <span>{t('cancel')}</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default MatchmakingPage;
