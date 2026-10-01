import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Socket } from 'socket.io-client'
import { useGameSocketContext } from '../context/GameSocketContext'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { useToast } from '../context/ToastContext'

import { getPieceImageSrc } from '../constants/gameConstants'
import type { GameModeType } from '../constants/gameModeConstats'
import { playSound, type SoundType } from '../utils/sound'

function getSoundForSan(san?: string, isSelf = false): SoundType {
    if (!san) return isSelf ? 'move-self' : 'move-opponent'
    if (san.includes('+') || san.includes('#')) {
        return 'move-check'
    }
    if (san.includes('O-O')) {
        return 'castle'
    }
    if (san.includes('=')) {
        return 'promote'
    }
    if (san.includes('x')) {
        return 'capture'
    }
    return isSelf ? 'move-self' : 'move-opponent'
}

import type { LayoutContextType } from '../layouts/MainLayout'

interface Premove {
    from: string
    to: string
    promotion?: string
}

export type DrawOfferState = 'idle' | 'sent' | 'received' | 'declined'

export type PlayerInfo = {
    id?: number
    username: string
    avatar?: string | null
    rating?: number | null
    isProvisional?: boolean
    ratingDelta?: number | null
}

const getSimulatedChess = (baseFen: string, color: 'w' | 'b' | null, premoveList: Premove[]) => {
    let sim: Chess
    try {
        sim = new Chess(baseFen)
    } catch {
        return new Chess()
    }
    if (!color || premoveList.length === 0) return sim

    for (const pm of premoveList) {
        // King must never be capturable when premoving and must be considered illegal
        const targetPiece = sim.get(pm.to as Square)
        if (targetPiece?.type === 'k') {
            break
        }

        const tokens = sim.fen().split(' ')
        tokens[1] = color
        try {
            sim.load(tokens.join(' '))
            const moveRes = sim.move({ from: pm.from, to: pm.to, promotion: pm.promotion || 'q' })
            if (!moveRes || moveRes.captured === 'k') {
                break
            }
        } catch {
            break
        }
    }
    return sim
}

export function useGameSocket() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const navigate = useNavigate()
    const { gameId: paramGameId } = useParams()
    const [searchParams] = useSearchParams()

    const activeGameId = paramGameId || ''
    const { currentUser } = useOutletContext<LayoutContextType>()
    const { socket } = useGameSocketContext()

    // Spectator / Viewer Mode State
    const [isViewer, setIsViewer] = useState(false)
    const isViewerRef = useRef(false)
    isViewerRef.current = isViewer
    const [whitePlayer, setWhitePlayer] = useState<PlayerInfo | null>(null)
    const [blackPlayer, setBlackPlayer] = useState<PlayerInfo | null>(null)

    // Matchmaking and Game States
    const [gameState, setGameState] = useState<'searching' | 'playing'>('searching')
    const [selectedMode, setSelectedMode] = useState<GameModeType>(
        (searchParams.get('mode') as GameModeType) || 'blitz'
    )
    const [opponentName, setOpponentName] = useState('')
    const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
    const [gameId, setGameId] = useState(activeGameId)
    const [turn, setTurn] = useState<'w' | 'b'>('w')
    const [isCheck, setIsCheck] = useState(false)

    // Game Outcome States
    const [isGameOver, setIsGameOver] = useState(false)
    const [hideGameOverModal, setHideGameOverModal] = useState(false)
    const [winnerColor, setWinnerColor] = useState<'w' | 'b' | null>(null)
    const [gameOverReason, setGameOverReason] = useState('')

    // Draw Offer States
    const [drawOfferState, setDrawOfferState] = useState<DrawOfferState>('idle')

    // Finished Match Database ID
    const [savedMatchId, setSavedMatchId] = useState<number | null>(null)

    // Rating States
    const [playerRating, setPlayerRating] = useState<number | null>(null)
    const [playerIsProvisional, setPlayerIsProvisional] = useState(false)
    const [opponentRating, setOpponentRating] = useState<number | null>(null)
    const [opponentIsProvisional, setOpponentIsProvisional] = useState(false)
    const [opponentAvatar, setOpponentAvatar] = useState<string | null>(null)
    const [playerRatingAfter, setPlayerRatingAfter] = useState<number | null>(null)
    const [playerRatingDelta, setPlayerRatingDelta] = useState<number | null>(null)

    // Timing States
    const [whiteTime, setWhiteTime] = useState(180000)
    const [blackTime, setBlackTime] = useState(180000)
    const [isPaused, setIsPaused] = useState(false)
    const [pauseCountdown, setPauseCountdown] = useState<number | null>(null)

    // Chess Rules engine
    const [localChess] = useState(() => new Chess())
    const [boardFen, setBoardFen] = useState(localChess.fen())
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)

    // Premove States & Refs
    const [premoves, setPremoves] = useState<Premove[]>([])

    const premovesRef = useRef<Premove[]>([])
    premovesRef.current = premoves
    const playerColorRef = useRef<'w' | 'b'>(playerColor)
    playerColorRef.current = playerColor
    const gameIdRef = useRef<string>(gameId)
    gameIdRef.current = gameId

    // Move History
    const [moveHistory, setMoveHistory] = useState<string[]>(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'])
    const [viewIndex, setViewIndex] = useState<number>(0)
    const [displayChess] = useState(() => new Chess())
    const [moveSAN, setMoveSAN] = useState<string[]>([])
    const [moveTimes, setMoveTimes] = useState<number[]>([])

    const socketRef = useRef<Socket | null>(null)

    const hasWarnedLowTimeRef = useRef(false)
    const isLiveMoveRef = useRef(false)
    const prevViewIndexRef = useRef<number | null>(null)

    const handleIllegalMove = () => {
        playSound('illegal')
    }

    const handleLowTimeWarning = () => {
        playSound('tenseconds')
    }

    // Preload piece images
    useEffect(() => {
        const colors: Array<'w' | 'b'> = ['w', 'b']
        const types = ['p', 'n', 'b', 'r', 'q', 'k']
        for (const color of colors) {
            for (const type of types) {
                const img = new Image()
                img.src = getPieceImageSrc(type, color)
            }
        }
    }, [])

    useEffect(() => {
        if (!activeGameId) {
            toast.error(t('game_not_found', 'Game not found'))
            navigate('/home', { replace: true })
        }
    }, [activeGameId, navigate, t, toast])

    // Socket connection & game event handlers
    const currentUserId = currentUser?.id

    useEffect(() => {
        if (!socket || !currentUser || !activeGameId) return

        socketRef.current = socket

        const onConnect = () => {
            console.log('Game Arena Socket connected:', socket.id)
            socket.emit('join_game', { gameId: activeGameId })
        }
        socket.on('connect', onConnect)

        if (socket.connected) {
            socket.emit('join_game', { gameId: activeGameId })
        }

        const handleGameState = (data: {
            gameId: string
            role?: 'player' | 'viewer'
            color?: 'w' | 'b'
            opponentName?: string
            opponentAvatar?: string
            playerAvatar?: string
            fen: string
            whiteTime: number
            blackTime: number
            turn: 'w' | 'b'
            history: string[]
            mode: GameModeType
            isPaused?: boolean
            isGameOver?: boolean
            winner?: 'w' | 'b' | null
            reason?: string
            savedMatchId?: number
            playerRating?: number
            playerIsProvisional?: boolean
            opponentRating?: number
            opponentIsProvisional?: boolean
            whitePlayer?: PlayerInfo
            blackPlayer?: PlayerInfo
        }) => {
            const isViewerMode = data.role === 'viewer'
            setIsViewer(isViewerMode)
            setGameId(data.gameId)
            setPlayerColor(data.color || 'w')
            setOpponentName(data.opponentName || '')
            setOpponentAvatar(data.opponentAvatar ?? null)
            setPlayerRating(data.playerRating ?? null)
            setPlayerIsProvisional(data.playerIsProvisional ?? false)
            setOpponentRating(data.opponentRating ?? null)
            setOpponentIsProvisional(data.opponentIsProvisional ?? false)
            if (data.whitePlayer) setWhitePlayer(data.whitePlayer)
            if (data.blackPlayer) setBlackPlayer(data.blackPlayer)
            setPlayerRatingAfter(null)
            setPlayerRatingDelta(null)

            localChess.load(data.fen)
            setBoardFen(data.fen)

            setWhiteTime(data.whiteTime)
            setBlackTime(data.blackTime)
            setTurn(data.turn)
            setGameState('playing')
            setIsGameOver(data.isGameOver || false)
            setHideGameOverModal(isViewerMode)
            setWinnerColor(data.winner ?? null)
            setGameOverReason(data.reason ?? '')
            setLastMove(null)
            setIsPaused(data.isPaused || false)
            setSelectedMode(data.mode)
            setPremoves([])
            setDrawOfferState('idle')
            setSavedMatchId(data.savedMatchId ?? (data.gameId ? parseInt(data.gameId, 10) : null))
            hasWarnedLowTimeRef.current = false
            if (!data.isGameOver) {
                playSound('game-start')
            }

            const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
            const historyFens: string[] = [startFen]
            if (data.history && data.history.length > 0) {
                const replayChess = new Chess()
                for (const san of data.history) {
                    try { replayChess.move(san) } catch { }
                    historyFens.push(replayChess.fen())
                }
            }
            setMoveHistory(historyFens)
            isLiveMoveRef.current = true
            prevViewIndexRef.current = historyFens.length - 1
            setViewIndex(historyFens.length - 1)
            setMoveSAN(data.history || [])
            setMoveTimes([])
        }

        socket.on('game_state', handleGameState)
        socket.on('match_found', handleGameState)

        const handleMoveMade = (data: {
            fen: string
            san: string
            lastMove: { from: string; to: string }
            turn: 'w' | 'b'
            whiteTime: number
            blackTime: number
            isCheck: boolean
            isGameOver: boolean
            timeSpent?: number
        }) => {
            isLiveMoveRef.current = true
            localChess.load(data.fen)
            setBoardFen(data.fen)
            setTurn(data.turn)
            setWhiteTime(data.whiteTime)
            setBlackTime(data.blackTime)
            setIsCheck(data.isCheck)
            setLastMove(data.lastMove)

            setMoveHistory(prev => {
                const next = [...prev, data.fen]
                setViewIndex(next.length - 1)
                return next
            })
            setMoveSAN(prev => [...prev, data.san])
            setMoveTimes(prev => [...prev, data.timeSpent ?? 1000])

            const isSelf = data.turn !== playerColorRef.current

            if (data.isCheck) {
                playSound('move-check')
            } else if (data.san.includes('O-O')) {
                playSound('castle')
            } else if (data.san.includes('=')) {
                playSound('promote')
            } else if (data.san.includes('x')) {
                playSound('capture')
            } else if (isSelf) {
                playSound('move-self')
            } else {
                playSound('move-opponent')
            }

            const myNewTime = playerColorRef.current === 'w' ? data.whiteTime : data.blackTime
            if (myNewTime > 10000) {
                hasWarnedLowTimeRef.current = false
            }

            if (data.turn === playerColorRef.current && premovesRef.current.length > 0) {
                const nextPremove = premovesRef.current[0]
                const testChess = new Chess(data.fen)
                let validMove = null
                try {
                    const targetPiece = testChess.get(nextPremove.to as Square)
                    if (targetPiece?.type !== 'k') {
                        validMove = testChess.move({
                            from: nextPremove.from,
                            to: nextPremove.to,
                            promotion: nextPremove.promotion || 'q',
                        })
                    }
                } catch { }

                if (validMove && validMove.captured !== 'k') {
                    if (socketRef.current && gameIdRef.current) {
                        socketRef.current.emit('make_move', {
                            gameId: gameIdRef.current,
                            from: nextPremove.from,
                            to: nextPremove.to,
                            promotion: nextPremove.promotion,
                            isPremove: true,
                        })
                    }
                    setPremoves(prev => prev.slice(1))
                } else {
                    handleIllegalMove()
                    setPremoves([])
                }
            }
        }
        socket.on('move_made', handleMoveMade)

        const handleOpponentDisconnected = (data: { userId: number; graceSeconds: number }) => {
            setIsPaused(true)
            setPauseCountdown(data.graceSeconds)
        }
        socket.on('opponent_disconnected', handleOpponentDisconnected)

        const handleOpponentReconnected = () => {
            setIsPaused(false)
            setPauseCountdown(null)
        }
        socket.on('opponent_reconnected', handleOpponentReconnected)

        const handleGameOver = (data: {
            winner: 'w' | 'b' | null
            reason: string
            fen: string
            matchId?: number
            whiteRatingAfter?: number
            blackRatingAfter?: number
            whiteRatingDelta?: number
            blackRatingDelta?: number
        }) => {
            setIsGameOver(true)
            setHideGameOverModal(isViewerRef.current)
            setWinnerColor(data.winner)
            setGameOverReason(data.reason)
            setSavedMatchId(data.matchId || null)

            const isWhite = playerColorRef.current === 'w'
            const ratingAfter = isWhite ? data.whiteRatingAfter : data.blackRatingAfter
            const ratingDelta = isWhite ? data.whiteRatingDelta : data.blackRatingDelta
            setPlayerRatingAfter(ratingAfter ?? null)
            setPlayerRatingDelta(ratingDelta ?? null)
            if (ratingAfter !== undefined && ratingAfter !== null) {
                setPlayerRating(ratingAfter)
            }

            setPremoves([])
            localChess.load(data.fen)
            setBoardFen(data.fen)
            setIsPaused(false)
            setPauseCountdown(null)
            setDrawOfferState('idle')
            playSound('game-end')

            setMoveHistory(prev => {
                const last = prev[prev.length - 1]
                if (last === data.fen) return prev
                const next = [...prev, data.fen]
                isLiveMoveRef.current = true
                setViewIndex(next.length - 1)
                return next
            })
        }
        socket.on('game_over', handleGameOver)

        // Draw offer events
        const handleDrawOffered = () => {
            setDrawOfferState('received')
            playSound('drawoffer')
        }
        socket.on('draw_offered', handleDrawOffered)

        const handleDrawDeclined = () => {
            setDrawOfferState('declined')
        }
        socket.on('draw_declined', handleDrawDeclined)

        const handleError = (err: { message: string }) => {
            if (err.message === 'invalid_move') {
                handleIllegalMove()
            } else if (err.message === 'game_not_found' || err.message === 'missing_game_id') {
                toast.error(t('game_not_found', 'Game not found'))
                navigate('/home', { replace: true })
                return
            } else {
                toast.error(err.message || 'something_went_wrong')
            }
        }
        socket.on('error', handleError)

        return () => {
            socket.off('connect', onConnect)
            socket.off('game_state', handleGameState)
            socket.off('match_found', handleGameState)
            socket.off('move_made', handleMoveMade)
            socket.off('opponent_disconnected', handleOpponentDisconnected)
            socket.off('opponent_reconnected', handleOpponentReconnected)
            socket.off('game_over', handleGameOver)
            socket.off('draw_offered', handleDrawOffered)
            socket.off('draw_declined', handleDrawDeclined)
            socket.off('error', handleError)
            socketRef.current = null
        }
    }, [socket, currentUserId, activeGameId, navigate])


    // Pause countdown timer
    useEffect(() => {
        if (!isPaused || pauseCountdown === null || pauseCountdown <= 0) return
        const timer = setTimeout(() => {
            setPauseCountdown(prev => (prev !== null ? prev - 1 : null))
        }, 1000)
        return () => clearTimeout(timer)
    }, [isPaused, pauseCountdown])

    // Game clock
    useEffect(() => {
        if (gameState !== 'playing' || isGameOver || isPaused) return

        const timerInterval = setInterval(() => {
            if (turn === 'w') {
                setWhiteTime(prev => {
                    const next = Math.max(0, prev - 100)
                    if (playerColorRef.current === 'w' && next <= 10000 && next > 0 && !hasWarnedLowTimeRef.current) {
                        hasWarnedLowTimeRef.current = true
                        handleLowTimeWarning()
                    }
                    return next
                })
            } else {
                setBlackTime(prev => {
                    const next = Math.max(0, prev - 100)
                    if (playerColorRef.current === 'b' && next <= 10000 && next > 0 && !hasWarnedLowTimeRef.current) {
                        hasWarnedLowTimeRef.current = true
                        handleLowTimeWarning()
                    }
                    return next
                })
            }
        }, 100)

        return () => clearInterval(timerInterval)
    }, [gameState, isGameOver, isPaused, turn])

    // Arrow key navigation for move history
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return
            const total = moveHistory.length
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setViewIndex(v => Math.max(0, v - 1))
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                setViewIndex(v => Math.min(total - 1, v + 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setViewIndex(total - 1)
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setViewIndex(0)
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [gameState, moveHistory.length])

    // Play move sounds when scrolling through move history (both during and after match)
    useEffect(() => {
        if (prevViewIndexRef.current === null) {
            prevViewIndexRef.current = viewIndex
            return
        }

        if (isLiveMoveRef.current) {
            isLiveMoveRef.current = false
            prevViewIndexRef.current = viewIndex
            return
        }

        if (prevViewIndexRef.current === viewIndex) return

        prevViewIndexRef.current = viewIndex

        if (viewIndex === 0) {
            playSound('move-self')
            return
        }

        const san = moveSAN[viewIndex - 1]
        const isWhiteMove = viewIndex % 2 === 1
        const isSelf = (playerColorRef.current === 'w' && isWhiteMove) ||
                       (playerColorRef.current === 'b' && !isWhiteMove)

        const sound = getSoundForSan(san, isSelf)
        playSound(sound)
    }, [viewIndex, moveSAN])

    // Captured pieces calculation
    const { captured, whiteScore, blackScore } = (() => {
        const initial = {
            w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
            b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
        }

        const current = {
            w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
            b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
        }

        for (const rank of ['1', '2', '3', '4', '5', '6', '7', '8']) {
            for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
                const piece = localChess.get(`${file}${rank}` as Square)
                if (piece && piece.type !== 'k') {
                    current[piece.color][piece.type]++
                }
            }
        }

        const capturedList = {
            w: [] as Array<{ type: string; color: 'w' | 'b' }>,
            b: [] as Array<{ type: string; color: 'w' | 'b' }>
        }

        const pieceValues: Record<string, number> = {
            p: 1, n: 3, b: 3, r: 5, q: 9
        }

        let wVal = 0
        let bVal = 0

        for (const type of ['p', 'n', 'b', 'r', 'q'] as const) {
            const lostWhite = initial.w[type] - current.w[type]
            for (let i = 0; i < lostWhite; i++) {
                capturedList.w.push({ type, color: 'w' })
                bVal += pieceValues[type]
            }

            const lostBlack = initial.b[type] - current.b[type]
            for (let i = 0; i < lostBlack; i++) {
                capturedList.b.push({ type, color: 'b' })
                wVal += pieceValues[type]
            }
        }

        return {
            captured: capturedList,
            whiteScore: wVal,
            blackScore: bVal
        }
    })()

    const isReviewing = viewIndex < moveHistory.length - 1
    const displayFen = useMemo(() => {
        if (isReviewing) return moveHistory[viewIndex] ?? boardFen
        if (premoves.length > 0 && playerColor) {
            try {
                return getSimulatedChess(boardFen, playerColor, premoves).fen()
            } catch {
                return boardFen
            }
        }
        return boardFen
    }, [isReviewing, viewIndex, moveHistory, boardFen, premoves, playerColor])

    try {
        displayChess.load(displayFen)
    } catch {
        try {
            displayChess.load(boardFen)
        } catch { }
    }

    const premoveSquares = useMemo(() => {
        const set = new Set<string>()
        for (const pm of premoves) {
            set.add(pm.from)
            set.add(pm.to)
        }
        return set
    }, [premoves])

    const ranks = playerColor === 'b' ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1']
    const files = playerColor === 'b' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

    const startMatchmaking = (modeOverride?: GameModeType) => {
        const mode = modeOverride || selectedMode
        navigate(`/game?mode=${encodeURIComponent(mode)}`)
    }

    const cancelMatchmaking = () => {
        navigate('/home')
    }

    const resignGame = () => {
        const activeSocket = socketRef.current || socket
        if (activeSocket && gameId && !isViewerRef.current) {
            if (confirm(t('confirm_resign', 'Are you sure you want to resign?'))) {
                activeSocket.emit('resign_game', { gameId })
            }
        }
    }

    const sendMove = (from: string, to: string, promotion?: string) => {
        const activeSocket = socketRef.current || socket
        if (activeSocket && gameId && !isViewerRef.current) {
            activeSocket.emit('make_move', {
                gameId,
                from,
                to,
                promotion,
            })
        }
    }

    // Auto-clear declined draw notice after 5 seconds
    useEffect(() => {
        if (drawOfferState !== 'declined') return
        const timer = setTimeout(() => {
            setDrawOfferState('idle')
        }, 5000)
        return () => clearTimeout(timer)
    }, [drawOfferState])

    // Draw actions
    const offerDraw = () => {
        const activeSocket = socketRef.current || socket
        if (activeSocket && gameId && !isViewerRef.current) {
            setDrawOfferState('sent')
            activeSocket.emit('draw_offer', { gameId })
        }
    }

    const acceptDraw = () => {
        const activeSocket = socketRef.current || socket
        if (activeSocket && gameId && !isViewerRef.current) {
            setDrawOfferState('idle')
            activeSocket.emit('draw_accept', { gameId })
        }
    }

    const declineDraw = () => {
        const activeSocket = socketRef.current || socket
        if (activeSocket && gameId && !isViewerRef.current) {
            setDrawOfferState('idle')
            activeSocket.emit('draw_decline', { gameId })
        }
    }

    const analyzeGame = () => {
        if (savedMatchId) {
            navigate(`/game/analysis/${savedMatchId}`)
        } else if (currentUser?.username) {
            navigate(`/profile/${currentUser.username}?tab=games`)
        } else {
            navigate('/home')
        }
    }

    return {
        currentUser,
        isViewer,
        whitePlayer,
        blackPlayer,
        gameState,
        selectedMode,
        opponentName,
        playerColor,
        gameId,
        turn,
        isCheck,
        isGameOver,
        hideGameOverModal,
        setHideGameOverModal,
        winnerColor,
        gameOverReason,
        whiteTime,
        blackTime,
        isPaused,
        pauseCountdown,
        boardFen,
        lastMove,
        premoves,
        setPremoves,
        moveHistory,
        viewIndex,
        setViewIndex,
        displayChess,
        displayFen,
        moveSAN,
        moveTimes,
        premoveSquares,
        ranks,
        files,
        isReviewing,
        captured,
        whiteScore,
        blackScore,
        startMatchmaking,
        cancelMatchmaking,
        resignGame,
        sendMove,
        setIsGameOver,
        drawOfferState,
        offerDraw,
        acceptDraw,
        declineDraw,
        savedMatchId,
        analyzeGame,
        playerRating,
        playerIsProvisional,
        opponentRating,
        opponentIsProvisional,
        opponentAvatar,
        playerRatingAfter,
        playerRatingDelta,
        isLowTime: !isViewer && gameState === 'playing' && !isGameOver && (playerColor === 'w' ? whiteTime : blackTime) <= 10000,
        handleIllegalMove,
        handleLowTimeWarning,
    }
}

export { getSimulatedChess }
export type { Premove }
