import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Socket } from 'socket.io-client'
import { useGameSocketContext } from '../../context/GameSocketContext'
import { usePageTitle } from '../../hooks/usePageTitle'
import { getPieceImageSrc } from '../../constants/gameConstants'
import type { GameModeType } from '../../constants/gameModeConstats'
import type { LayoutContextType } from '../../layouts/MainLayout'
import styles from './MatchmakingPage.module.css'

export default function MatchmakingPage() {
    const { t } = useTranslation()
    usePageTitle('page_title_searching', 'Finding Match...')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const modeParam = (searchParams.get('mode') || 'blitz') as GameModeType
    const { currentUser } = useOutletContext<LayoutContextType>()
    const { socket } = useGameSocketContext()
    const socketRef = useRef<Socket | null>(null)
    const matchFoundRef = useRef(false)

    // Matchmaking socket connection
    useEffect(() => {
        if (!currentUser || !socket) return

        matchFoundRef.current = false
        socketRef.current = socket

        const onConnect = () => {
            console.log('Matchmaking Socket connected:', socket.id)
            socket.emit('find_match', { mode: modeParam })
        }

        const onMatchFound = (data: { gameId: string }) => {
            console.log('Match found! Navigating to /game/' + data.gameId)
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
    }, [socket, currentUser, modeParam, navigate])

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
        ? (userRatingInfo.isProvisional ? `~${userRatingInfo.rating} (${t('provisional', 'provisional')})` : `${userRatingInfo.rating}`)
        : `~800 (${t('provisional', 'provisional')})`

    return (
        <div className={styles.pageContainer}>
            <main className={styles.mainContent}>
                <div className={styles.searchingCard}>
                    <div className={styles.searchingPulse}>
                        <img
                            src={getPieceImageSrc('p', 'w')}
                            alt=""
                            className={styles.searchingPulseIcon}
                        />
                    </div>
                    <h3>{t('searching_match', 'Searching for opponent...')}</h3>
                    <p>
                        {t('searching_desc', 'Filtering by match speed: ')}{' '}
                        <span className={styles.modeBadge}>{modeParam}</span>
                    </p>
                    <p className={styles.searchingRating}>
                        {t('your_rating', 'Your rating')}: <strong>{searchingRatingText}</strong>
                    </p>
                    <button
                        type="button"
                        className={styles.cancelMatchBtn}
                        onClick={handleCancel}
                    >
                        ✕ {t('cancel', 'Cancel')}
                    </button>
                </div>
            </main>
        </div>
    )
}
