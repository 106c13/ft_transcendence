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
    const matchmakingStartedRef = useRef(false)
    const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const matchmakingModeRef = useRef<GameModeType | null>(null)

    // Matchmaking socket connection
    useEffect(() => {
        if (!currentUserId || !socket) return

        if (matchmakingModeRef.current !== modeParam) {
            matchmakingModeRef.current = modeParam
            matchmakingStartedRef.current = false
            matchFoundRef.current = false
        }

        if (cancelTimerRef.current) {
            clearTimeout(cancelTimerRef.current)
            cancelTimerRef.current = null
        }
        socketRef.current = socket

        const onConnect = () => {
            if (!matchmakingStartedRef.current) {
                matchmakingStartedRef.current = true
                socket.emit('find_match', { mode: modeParam })
            }
        }

        const onMatchFound = (data: { gameId: string }) => {
            matchFoundRef.current = true
            navigate(`/game/${data.gameId}`)
        }

        socket.on('connect', onConnect)
        socket.on('match_found', onMatchFound)

        if (socket.connected && !matchmakingStartedRef.current) {
            matchmakingStartedRef.current = true
            socket.emit('find_match', { mode: modeParam })
        }

        return () => {
            socket.off('connect', onConnect)
            socket.off('match_found', onMatchFound)

            // Defer cancellation so StrictMode's setup/cleanup/setup cycle does
            // not cancel the queue created by the next effect setup.
            if (!matchFoundRef.current) {
                cancelTimerRef.current = setTimeout(() => {
                    if (!matchFoundRef.current && socketRef.current === socket && socket.connected) {
                        socket.emit('cancel_queue')
                    }
                    cancelTimerRef.current = null
                }, 0)
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
        <div className={`${styles.pageContainer} min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-4 bg-slate-900 text-slate-100 box-border`}>
            <main className={`${styles.mainContent} flex items-center justify-center w-full`}>
                <div className={`${styles.searchingCard} flex flex-col items-center max-w-sm w-full p-8 rounded-2xl bg-slate-800/90 border border-slate-700/60 shadow-2xl text-center`}>
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
                    <h3 className="text-xl font-bold text-slate-100 mt-4 mb-2">{t('searching_match')}</h3>
                    <p className={`${styles.searchingDesc} text-sm text-slate-400 mb-2`}>
                        {t('searching_desc')}{' '}
                        <span className={`${styles.modeBadge} inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30`}>{modeParam}</span>
                    </p>
                    <p className={`${styles.searchingRating} text-xs text-slate-400 mb-6`}>
                        {t('your_rating')}: <strong className="text-slate-200">{searchingRatingText}</strong>
                    </p>
                    <button
                        type="button"
                        className={`${styles.cancelMatchBtn} flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition duration-150 font-medium cursor-pointer`}
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
