import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import io, { Socket } from 'socket.io-client'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

import { getPieceImageSrc } from '../constants/gameConstants'

interface Premove {
    from: string
    to: string
    promotion?: string
}

interface User {
    id: number
    username: string
    email: string
    avatar?: string
    bio?: string
    status?: 'ONLINE' | 'OFFLINE' | 'INGAME'
}

const getSimulatedChess = (baseFen: string, color: 'w' | 'b' | null, premoveList: Premove[]) => {
    const sim = new Chess(baseFen)
    if (!color || premoveList.length === 0) return sim

    for (const pm of premoveList) {
        const tokens = sim.fen().split(' ')
        tokens[1] = color
        sim.load(tokens.join(' '))
        try {
            sim.move({ from: pm.from, to: pm.to, promotion: pm.promotion || 'q' })
        } catch {
            break
        }
    }
    return sim
}

export type GameMode = 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'

export function useGameSocket() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [currentUser, setCurrentUser] = useState<User | null>(null)

    // Matchmaking and Game States
    const [gameState, setGameState] = useState<'searching' | 'playing'>('searching')
    const [selectedMode, setSelectedMode] = useState<GameMode>(
        (searchParams.get('mode') as GameMode) || 'blitz'
    )
    const [opponentName, setOpponentName] = useState('')
    const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
    const [gameId, setGameId] = useState('')
    const [turn, setTurn] = useState<'w' | 'b'>('w')
    const [isCheck, setIsCheck] = useState(false)

    // Game Outcome States
    const [isGameOver, setIsGameOver] = useState(false)
    const [hideGameOverModal, setHideGameOverModal] = useState(false)
    const [winnerColor, setWinnerColor] = useState<'w' | 'b' | null>(null)
    const [gameOverReason, setGameOverReason] = useState('')

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

    const socketRef = useRef<Socket | null>(null)
    const token = localStorage.getItem('token')

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

    // Socket connection & game event handlers
    useEffect(() => {
        if (!currentUser) return

        const modeParam = (searchParams.get('mode') || 'blitz') as GameMode
        setSelectedMode(modeParam)

        const socket = io('http://localhost:8080/game', {
            query: { userId: currentUser.id.toString() },
            transports: ['websocket'],
        })
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Game Socket connected')
            const mode = (searchParams.get('mode') || 'blitz') as GameMode
            setGameState('searching')
            socket.emit('find_match', { mode })
        })

        socket.on('match_found', (data: {
            gameId: string
            color: 'w' | 'b'
            opponentName: string
            fen: string
            whiteTime: number
            blackTime: number
            turn: 'w' | 'b'
            history: string[]
            mode: 'bullet' | 'blitz' | 'rapid'
            isPaused?: boolean
        }) => {
            setGameId(data.gameId)
            setPlayerColor(data.color)
            setOpponentName(data.opponentName)
            localChess.load(data.fen)
            setBoardFen(data.fen)
            setWhiteTime(data.whiteTime)
            setBlackTime(data.blackTime)
            setTurn(data.turn)
            setGameState('playing')
            setIsGameOver(false)
            setHideGameOverModal(false)
            setWinnerColor(null)
            setGameOverReason('')
            setLastMove(null)
            setIsPaused(data.isPaused || false)
            setSelectedMode(data.mode)
            setPremoves([])

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
            setViewIndex(historyFens.length - 1)
            setMoveSAN(data.history)
        })

        socket.on('move_made', (data: {
            fen: string
            san: string
            lastMove: { from: string; to: string }
            turn: 'w' | 'b'
            whiteTime: number
            blackTime: number
            isCheck: boolean
            isGameOver: boolean
        }) => {
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

            if (data.turn === playerColorRef.current && premovesRef.current.length > 0) {
                const nextPremove = premovesRef.current[0]
                const testChess = new Chess(data.fen)
                let validMove = null
                try {
                    validMove = testChess.move({
                        from: nextPremove.from,
                        to: nextPremove.to,
                        promotion: nextPremove.promotion || 'q',
                    })
                } catch { }

                if (validMove) {
                    if (socketRef.current && gameIdRef.current) {
                        socketRef.current.emit('make_move', {
                            gameId: gameIdRef.current,
                            from: nextPremove.from,
                            to: nextPremove.to,
                            promotion: nextPremove.promotion,
                        })
                    }
                    setPremoves(prev => prev.slice(1))
                } else {
                    setPremoves([])
                }
            }
        })

        socket.on('opponent_disconnected', (data: { userId: number; graceSeconds: number }) => {
            setIsPaused(true)
            setPauseCountdown(data.graceSeconds)
        })

        socket.on('opponent_reconnected', () => {
            setIsPaused(false)
            setPauseCountdown(null)
        })

        socket.on('game_over', (data: {
            winner: 'w' | 'b' | null
            reason: string
            fen: string
        }) => {
            setIsGameOver(true)
            setHideGameOverModal(false)
            setWinnerColor(data.winner)
            setGameOverReason(data.reason)
            setPremoves([])
            localChess.load(data.fen)
            setBoardFen(data.fen)
            setIsPaused(false)
            setPauseCountdown(null)

            setMoveHistory(prev => {
                const last = prev[prev.length - 1]
                if (last === data.fen) return prev
                const next = [...prev, data.fen]
                setViewIndex(next.length - 1)
                return next
            })
        })

        socket.on('error', (err: { message: string }) => {
            alert(err.message || 'Error occurred')
        })

        return () => {
            socket.disconnect()
        }
    }, [currentUser, localChess, searchParams])

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
                setWhiteTime(prev => Math.max(0, prev - 100))
            } else {
                setBlackTime(prev => Math.max(0, prev - 100))
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
            return getSimulatedChess(boardFen, playerColor, premoves).fen()
        }
        return boardFen
    }, [isReviewing, viewIndex, moveHistory, boardFen, premoves, playerColor])

    displayChess.load(displayFen)

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

    const startMatchmaking = () => {
        if (socketRef.current) {
            setGameState('searching')
            socketRef.current.emit('find_match', { mode: selectedMode })
        }
    }

    const cancelMatchmaking = () => {
        if (socketRef.current) {
            socketRef.current.emit('leave_game')
        }
        navigate('/home')
    }

    const resignGame = () => {
        if (socketRef.current && gameId) {
            if (confirm(t('confirm_resign', 'Are you sure you want to resign?'))) {
                socketRef.current.emit('leave_game', { gameId })
            }
        }
    }

    const sendMove = (from: string, to: string, promotion?: string) => {
        if (socketRef.current && gameId) {
            socketRef.current.emit('make_move', {
                gameId,
                from,
                to,
                promotion,
            })
        }
    }

    return {
        currentUser,
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
    }
}

export { getSimulatedChess }
export type { Premove }
