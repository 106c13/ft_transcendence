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
        <div className="flex flex-col min-h-screen w-full pt-16 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] text-slate-200 box-border">
            <main className="flex-1 flex flex-col items-center justify-center w-full px-4 pt-5 pb-9 box-border">
                <div className="flex flex-col items-center max-w-[460px] w-full px-4 min-[641px]:px-7 py-7 min-[641px]:py-9 rounded-[20px] bg-slate-800/70 backdrop-blur-md border border-slate-400/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center">
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
                    <h3 className="text-[22px] font-bold text-slate-50 mt-0 mb-2.5">{t('searching_match')}</h3>
                    <p className="text-sm text-slate-400 mt-0 mb-1">
                        {t('searching_desc')}{' '}
                        <span className="inline-block px-3 py-1 rounded-[10px] text-sm font-semibold bg-blue-500/15 text-blue-400 capitalize">{modeParam}</span>
                    </p>
                    <p className="text-sm text-slate-400 mt-0 mb-7">
                        {t('your_rating')}: <strong className="text-blue-400">{searchingRatingText}</strong>
                    </p>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 py-3 px-7 rounded-xl bg-red-500/12 hover:bg-red-500/25 text-red-400 border border-red-500/40 hover:border-red-500/70 hover:-translate-y-px transition-all duration-200 text-sm font-semibold cursor-pointer"
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
