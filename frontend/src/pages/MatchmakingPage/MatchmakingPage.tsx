import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Socket } from 'socket.io-client'
import { getGameSocket } from '../../utils/gameSocket'
import { usePageTitle } from '../../hooks/usePageTitle'
import { getPieceImageSrc } from '../../constants/gameConstants'
import type { GameModeType } from '../../constants/gameModeConstats'
import type { User } from '../../constants/profileConstants'
import styles from './MatchmakingPage.module.css'

export default function MatchmakingPage() {
    const { t } = useTranslation()
    usePageTitle('page_title_searching', 'Finding Match...')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const modeParam = (searchParams.get('mode') || 'blitz') as GameModeType
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const socketRef = useRef<Socket | null>(null)
    const matchFoundRef = useRef(false)
    const token = localStorage.getItem('token')

    // Load current user
    useEffect(() => {
        const loadCurrentUser = async () => {
            if (!token) {
                navigate('/login')
                return
            }
            try {
                const res = await fetch('/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setCurrentUser(data)
                } else {
                    localStorage.removeItem('token')
                    navigate('/login')
                }
            } catch (error) {
                console.error('Error loading user:', error)
            }
        }
        loadCurrentUser()
    }, [navigate, token])

    // Matchmaking socket connection
    useEffect(() => {
        if (!currentUser) return

        matchFoundRef.current = false
        const socket = getGameSocket(currentUser.id)
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
    }, [currentUser, modeParam, navigate])

    const handleCancel = () => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('cancel_queue')
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
