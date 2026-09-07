import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import io, { Socket } from 'socket.io-client'

export interface ChallengeReceived {
    challengeId: string
    from: string
    mode: string
}

export type ChallengeStatus = 'idle' | 'sending' | 'sent' | 'accepted' | 'declined' | 'expired' | 'error'

export function useChallengeSocket(userId: number | undefined) {
    const navigate = useNavigate()
    const socketRef = useRef<Socket | null>(null)

    const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>('idle')
    const [challengeError, setChallengeError] = useState('')
    const [incomingChallenge, setIncomingChallenge] = useState<ChallengeReceived | null>(null)
    const [challengeCountdown, setChallengeCountdown] = useState<number>(30)
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Connect to the challenge namespace
    useEffect(() => {
        if (!userId) return

        const socket = io('/challenge', {
            query: { userId: userId.toString() },
            transports: ['websocket', 'polling'],
        })
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Challenge Socket connected:', socket.id)
        })

        socket.on('challenge_sent', (_data: { challengeId: string; friendUsername: string; mode: string }) => {
            setChallengeStatus('sent')
            setChallengeError('')
            startCountdown()
        })

        socket.on('challenge_received', (data: ChallengeReceived) => {
            setIncomingChallenge(data)
            startCountdown()
        })

        socket.on('challenge_accepted', (data: { challengeId: string; gameId: string; mode: string }) => {
            setChallengeStatus('accepted')
            setIncomingChallenge(null)
            clearCountdown()
            // Navigate to the game page with the challenge gameId
            navigate(`/game?mode=${encodeURIComponent(data.mode)}&challenge=${data.gameId}`)
        })

        socket.on('challenge_declined', (_data: { challengeId: string }) => {
            setChallengeStatus('declined')
            clearCountdown()
            // Auto-reset after 3 seconds
            setTimeout(() => setChallengeStatus('idle'), 3000)
        })

        socket.on('challenge_expired', (_data: { challengeId: string }) => {
            setChallengeStatus('expired')
            setIncomingChallenge(null)
            clearCountdown()
            // Auto-reset after 3 seconds
            setTimeout(() => setChallengeStatus('idle'), 3000)
        })

        socket.on('challenge_error', (data: { message: string }) => {
            setChallengeStatus('error')
            setChallengeError(data.message)
            // Auto-reset after 3 seconds
            setTimeout(() => {
                setChallengeStatus('idle')
                setChallengeError('')
            }, 3000)
        })

        return () => {
            socket.disconnect()
            clearCountdown()
        }
    }, [userId])

    const startCountdown = () => {
        setChallengeCountdown(30)
        clearCountdown()
        countdownRef.current = setInterval(() => {
            setChallengeCountdown(prev => {
                if (prev <= 1) {
                    clearCountdown()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const clearCountdown = () => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
        }
    }

    const sendChallenge = useCallback((friendUsername: string, mode: string) => {
        if (socketRef.current) {
            setChallengeStatus('sending')
            setChallengeError('')
            socketRef.current.emit('send_challenge', { friendUsername, mode })
        }
    }, [])

    const acceptChallenge = useCallback((challengeId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('accept_challenge', { challengeId })
        }
    }, [])

    const declineChallenge = useCallback((challengeId: string) => {
        if (socketRef.current) {
            setIncomingChallenge(null)
            clearCountdown()
            socketRef.current.emit('decline_challenge', { challengeId })
        }
    }, [])

    const resetChallengeStatus = useCallback(() => {
        setChallengeStatus('idle')
        setChallengeError('')
    }, [])

    return {
        challengeStatus,
        challengeError,
        incomingChallenge,
        challengeCountdown,
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        resetChallengeStatus,
    }
}
