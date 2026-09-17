import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import io, { Socket } from 'socket.io-client'
import { useToast } from '../context/ToastContext'

export interface ChallengeReceived {
    challengeId: string
    from: string
    mode: string
}

export interface ChallengeSent {
    challengeId: string
    friendUsername: string
    mode: string
}

export type ChallengeStatus = 'idle' | 'sending' | 'sent' | 'accepted' | 'declined' | 'expired' | 'error'

export function useChallengeSocket(userId: number | undefined) {
    const navigate = useNavigate()
    const { toast } = useToast()
    const socketRef = useRef<Socket | null>(null)

    const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>('idle')
    const [challengeError, setChallengeError] = useState('')

    // Incoming Challenge State & Timer (countdown strictly for incoming challenge)
    const [incomingChallenge, setIncomingChallenge] = useState<ChallengeReceived | null>(null)
    const [incomingCountdown, setIncomingCountdown] = useState<number>(30)
    const incomingCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const incomingChallengeRef = useRef<ChallengeReceived | null>(null)

    useEffect(() => {
        incomingChallengeRef.current = incomingChallenge
    }, [incomingChallenge])

    // Outgoing Challenge State & Timer (countdown strictly for outgoing challenge)
    const [outgoingChallenge, setOutgoingChallenge] = useState<ChallengeSent | null>(null)
    const [outgoingCountdown, setOutgoingCountdown] = useState<number>(30)
    const outgoingCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const outgoingChallengeRef = useRef<ChallengeSent | null>(null)

    useEffect(() => {
        outgoingChallengeRef.current = outgoingChallenge
    }, [outgoingChallenge])

    const outgoingToastIdRef = useRef<string | null>(null)

    const clearIncomingCountdown = useCallback(() => {
        if (incomingCountdownRef.current) {
            clearInterval(incomingCountdownRef.current)
            incomingCountdownRef.current = null
        }
    }, [])

    const clearOutgoingCountdown = useCallback(() => {
        if (outgoingCountdownRef.current) {
            clearInterval(outgoingCountdownRef.current)
            outgoingCountdownRef.current = null
        }
    }, [])

    const startIncomingCountdown = useCallback(() => {
        setIncomingCountdown(30)
        clearIncomingCountdown()
        incomingCountdownRef.current = setInterval(() => {
            setIncomingCountdown((prev) => {
                if (prev <= 1) {
                    clearIncomingCountdown()
                    setIncomingChallenge(null)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [clearIncomingCountdown])

    const startOutgoingCountdown = useCallback(() => {
        setOutgoingCountdown(30)
        clearOutgoingCountdown()
        outgoingCountdownRef.current = setInterval(() => {
            setOutgoingCountdown((prev) => {
                if (prev <= 1) {
                    clearOutgoingCountdown()
                    setChallengeStatus('idle')
                    setOutgoingChallenge(null)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [clearOutgoingCountdown])

    const navigateRef = useRef(navigate)
    const toastRef = useRef(toast)
    const startIncomingCountdownRef = useRef(startIncomingCountdown)
    const startOutgoingCountdownRef = useRef(startOutgoingCountdown)
    const clearIncomingCountdownRef = useRef(clearIncomingCountdown)
    const clearOutgoingCountdownRef = useRef(clearOutgoingCountdown)

    useEffect(() => {
        navigateRef.current = navigate
        toastRef.current = toast
        startIncomingCountdownRef.current = startIncomingCountdown
        startOutgoingCountdownRef.current = startOutgoingCountdown
        clearIncomingCountdownRef.current = clearIncomingCountdown
        clearOutgoingCountdownRef.current = clearOutgoingCountdown
    })

    const acceptedGameIdRef = useRef<string | null>(null)

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

        socket.on('challenge_sent', (data: ChallengeSent) => {
            setChallengeStatus('sent')
            setChallengeError('')
            setOutgoingChallenge(data)
            startOutgoingCountdownRef.current()

            if (outgoingToastIdRef.current) {
                toastRef.current.dismiss(outgoingToastIdRef.current)
            }
            const toastId = `outgoing_challenge_${data.challengeId}`
            outgoingToastIdRef.current = toastId
            toastRef.current.info('challenge_sent', { id: toastId, duration: 30000 })
        })

        socket.on('challenge_received', (data: ChallengeReceived) => {
            setIncomingChallenge(data)
            startIncomingCountdownRef.current()
        })

        socket.on('challenge_accepted', (data: { challengeId: string; gameId: string; mode: string }) => {
            if (acceptedGameIdRef.current === data.gameId) return
            acceptedGameIdRef.current = data.gameId

            setChallengeStatus('accepted')
            setIncomingChallenge(null)
            setOutgoingChallenge(null)
            clearIncomingCountdownRef.current()
            clearOutgoingCountdownRef.current()
            if (outgoingToastIdRef.current) {
                toastRef.current.dismiss(outgoingToastIdRef.current)
                outgoingToastIdRef.current = null
            }
            toastRef.current.success('challenge_accepted')
            // Auto-reset status after 5 seconds so it doesn't linger
            setTimeout(() => setChallengeStatus('idle'), 5000)
            // Navigate to the game page with the challenge gameId
            navigateRef.current(`/game?mode=${encodeURIComponent(data.mode)}&challenge=${data.gameId}`)
        })

        socket.on('challenge_declined', () => {
            setChallengeStatus('declined')
            clearOutgoingCountdownRef.current()
            setOutgoingChallenge(null)
            if (outgoingToastIdRef.current) {
                toastRef.current.dismiss(outgoingToastIdRef.current)
                outgoingToastIdRef.current = null
            }
            toastRef.current.warning('challenge_declined')
            // Auto-reset after 3 seconds
            setTimeout(() => setChallengeStatus('idle'), 3000)
        })

        socket.on('challenge_expired', (data?: { challengeId: string }) => {
            let wasIncoming = false
            let wasOutgoing = false

            if (!data?.challengeId || data.challengeId === incomingChallengeRef.current?.challengeId) {
                wasIncoming = true
                setIncomingChallenge(null)
                clearIncomingCountdownRef.current()
            }

            if (!data?.challengeId || data.challengeId === outgoingChallengeRef.current?.challengeId) {
                wasOutgoing = true
                setChallengeStatus('expired')
                setOutgoingChallenge(null)
                clearOutgoingCountdownRef.current()
                if (outgoingToastIdRef.current) {
                    toastRef.current.dismiss(outgoingToastIdRef.current)
                    outgoingToastIdRef.current = null
                }
                setTimeout(() => setChallengeStatus('idle'), 3000)
            }

            if (wasIncoming || wasOutgoing) {
                toastRef.current.info('challenge_expired')
            }
        })

        socket.on('challenge_error', (data: { message: string }) => {
            setChallengeStatus('error')
            setChallengeError(data.message)
            clearOutgoingCountdownRef.current()
            setOutgoingChallenge(null)
            if (outgoingToastIdRef.current) {
                toastRef.current.dismiss(outgoingToastIdRef.current)
                outgoingToastIdRef.current = null
            }
            toastRef.current.error(data.message || 'challenge_error')
            // Auto-reset after 3 seconds
            setTimeout(() => {
                setChallengeStatus('idle')
                setChallengeError('')
            }, 3000)
        })

        // Listen for global user presence status changes
        socket.on('user_status_changed', (data: { userId: number; username: string; status: string }) => {
            window.dispatchEvent(new CustomEvent('user_status_changed', { detail: data }))
        })

        return () => {
            socket.disconnect()
            clearIncomingCountdownRef.current()
            clearOutgoingCountdownRef.current()
            if (outgoingToastIdRef.current) {
                toastRef.current.dismiss(outgoingToastIdRef.current)
                outgoingToastIdRef.current = null
            }
        }
    }, [userId])

    const sendChallenge = useCallback((friendUsername: string, mode: string) => {
        if (socketRef.current) {
            setChallengeStatus('sending')
            setChallengeError('')
            socketRef.current.emit('send_challenge', { friendUsername, mode })
        }
    }, [])

    const acceptChallenge = useCallback((challengeId: string) => {
        if (socketRef.current) {
            setIncomingChallenge(null)
            clearIncomingCountdown()
            socketRef.current.emit('accept_challenge', { challengeId })
        }
    }, [clearIncomingCountdown])

    const declineChallenge = useCallback((challengeId: string) => {
        if (socketRef.current) {
            setIncomingChallenge(null)
            clearIncomingCountdown()
            socketRef.current.emit('decline_challenge', { challengeId })
        }
    }, [clearIncomingCountdown])

    const resetChallengeStatus = useCallback(() => {
        setChallengeStatus('idle')
        setChallengeError('')
        clearOutgoingCountdown()
        setOutgoingChallenge(null)
        if (outgoingToastIdRef.current) {
            toast.dismiss(outgoingToastIdRef.current)
            outgoingToastIdRef.current = null
        }
    }, [clearOutgoingCountdown, toast])

    return {
        challengeStatus,
        challengeError,
        incomingChallenge,
        outgoingChallenge,
        challengeCountdown: incomingCountdown,
        incomingCountdown,
        outgoingCountdown,
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        resetChallengeStatus,
    }
}
