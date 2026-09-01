import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import io, { Socket } from 'socket.io-client'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

import PlayerBanner from '../../components/PlayerBanner/Playerbanner'
import ChessBoard from '../../components/ChessBoard/ChessBoard'
import ChessInfoPanel from '../../components/ChessInfoPanel/ChessInfoPanel'
import GameOverDialog from '../../components/GameOverDialog/GameOverDialog'
import styles from './Game.module.css'

interface Premove {
    from: string
    to: string
    promotion?: string
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

const getValidMovesForSquare = (simChess: Chess, square: string, color: 'w' | 'b') => {
    const temp = new Chess(simChess.fen())
    const tokens = temp.fen().split(' ')
    tokens[1] = color
    temp.load(tokens.join(' '))
    try {
        const moves = temp.moves({ square: square as Square, verbose: true })
        return moves.map(m => m.to)
    } catch {
        return []
    }
}

const PIECE_ASSET_DIR = '/assets/pieces'

const getPieceImageSrc = (type: string, color: 'w' | 'b'): string => {
    return `${PIECE_ASSET_DIR}/${color}${type.toUpperCase()}.svg`
}

const PIECE_NAME: Record<string, string> = {
    p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King',
}

interface User {
    id: number
    username: string
    email: string
    avatar?: string
    bio?: string
    status?: 'ONLINE' | 'OFFLINE' | 'INGAME'
}

export default function Game() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [currentUser, setCurrentUser] = useState<User | null>(null)

    // Matchmaking and Game States
    const [gameState, setGameState] = useState<'searching' | 'playing'>('searching')
    const [selectedMode, setSelectedMode] = useState<'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'>(
        (searchParams.get('mode') as any) || 'blitz'
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
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
    const [validMoves, setValidMoves] = useState<string[]>([])
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)

    // Promotion Modal states
    const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null)
    const [showPromotion, setShowPromotion] = useState(false)

    // Premove States & Refs
    const [premoves, setPremoves] = useState<Premove[]>([])
    const [pendingPremove, setPendingPremove] = useState<Premove | null>(null)

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

    useEffect(() => {
        if (!currentUser) return

        const modeParam = (searchParams.get('mode') || 'blitz') as 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'
        setSelectedMode(modeParam)

        const socket = io('http://localhost:8080/game', {
            query: { userId: currentUser.id.toString() },
            transports: ['websocket'],
        })
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Game Socket connected')
            const mode = (searchParams.get('mode') || 'blitz') as 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'
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
            setSelectedSquare(null)
            setValidMoves([])
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
            setSelectedSquare(null)
            setValidMoves([])

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

    useEffect(() => {
        if (!isPaused || pauseCountdown === null || pauseCountdown <= 0) return
        const timer = setTimeout(() => {
            setPauseCountdown(prev => (prev !== null ? prev - 1 : null))
        }, 1000)
        return () => clearTimeout(timer)
    }, [isPaused, pauseCountdown])

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

    const handleDragStart = (e: React.DragEvent, square: string) => {
        if (gameState !== 'playing' || isGameOver || isPaused || isReviewing) {
            e.preventDefault()
            return
        }

        const simChess = getSimulatedChess(boardFen, playerColor, premoves)
        const piece = simChess.get(square as Square)
        if (!piece || piece.color !== playerColor) {
            e.preventDefault()
            return
        }

        e.dataTransfer.setData('text/plain', square)
        e.dataTransfer.effectAllowed = 'move'

        setSelectedSquare(square)
        const targets = getValidMovesForSquare(simChess, square, playerColor)
        setValidMoves(targets)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent, targetSquare: string) => {
        e.preventDefault()
        const sourceSquare = e.dataTransfer.getData('text/plain')

        if (sourceSquare && sourceSquare !== targetSquare) {
            if (validMoves.includes(targetSquare)) {
                const simChess = getSimulatedChess(boardFen, playerColor, premoves)
                const selectedPiece = simChess.get(sourceSquare as Square)
                const isPawn = selectedPiece?.type === 'p'
                const isPromotionRank = targetSquare.endsWith('8') || targetSquare.endsWith('1')

                const isRealTurn = turn === playerColor && premoves.length === 0

                if (isPawn && isPromotionRank) {
                    if (isRealTurn) {
                        setPendingMove({ from: sourceSquare, to: targetSquare })
                    } else {
                        setPendingPremove({ from: sourceSquare, to: targetSquare })
                    }
                    setShowPromotion(true)
                } else {
                    if (isRealTurn) {
                        sendMove(sourceSquare, targetSquare)
                    } else {
                        setPremoves(prev => [...prev, { from: sourceSquare, to: targetSquare }])
                        setSelectedSquare(null)
                        setValidMoves([])
                    }
                }
            } else {
                setSelectedSquare(null)
                setValidMoves([])
            }
        }
    }

    const handleSquareClick = (square: string) => {
        if (gameState !== 'playing' || isGameOver || isPaused || isReviewing) return

        const simChess = getSimulatedChess(boardFen, playerColor, premoves)
        const piece = simChess.get(square as Square)

        if (piece && piece.color === playerColor) {
            setSelectedSquare(square)
            const targets = getValidMovesForSquare(simChess, square, playerColor)
            setValidMoves(targets)
            return
        }

        if (selectedSquare && validMoves.includes(square)) {
            const selectedPiece = simChess.get(selectedSquare as Square)
            const isPawn = selectedPiece?.type === 'p'
            const isPromotionRank = square.endsWith('8') || square.endsWith('1')

            const isRealTurn = turn === playerColor && premoves.length === 0

            if (isPawn && isPromotionRank) {
                if (isRealTurn) {
                    setPendingMove({ from: selectedSquare, to: square })
                } else {
                    setPendingPremove({ from: selectedSquare, to: square })
                }
                setShowPromotion(true)
            } else {
                if (isRealTurn) {
                    sendMove(selectedSquare, square)
                } else {
                    setPremoves(prev => [...prev, { from: selectedSquare, to: square }])
                    setSelectedSquare(null)
                    setValidMoves([])
                }
            }
        } else {
            setSelectedSquare(null)
            setValidMoves([])
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
            setSelectedSquare(null)
            setValidMoves([])
        }
    }

    const handlePromotionSelect = (pieceCode: string) => {
        if (pendingPremove) {
            setPremoves(prev => [...prev, { ...pendingPremove, promotion: pieceCode }])
            setPendingPremove(null)
            setShowPromotion(false)
            setSelectedSquare(null)
            setValidMoves([])
        } else if (pendingMove) {
            sendMove(pendingMove.from, pendingMove.to, pieceCode)
            setPendingMove(null)
            setShowPromotion(false)
        }
    }

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

    return (
        <div className={styles.gameContainer}>
            <main className={styles.gameMain}>
                {gameState === 'searching' && (
                    <div className={styles.searchingCard}>
                        <div className={styles.searchingPulse}>
                            <img
                                src={getPieceImageSrc('p', 'w')}
                                alt=""
                                className={styles.searchingPulseIcon}
                            />
                        </div>
                        <h3>{t('searching_match', 'Searching for opponent...')}</h3>
                        <p>{t('searching_desc', 'Filtering by match speed: ')} <strong>{selectedMode}</strong></p>
                        <button className={styles.cancelMatchBtn} onClick={cancelMatchmaking}>
                            {t('cancel', 'Cancel')}
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className={styles.gamePlayArea}>
                        <div
                            className={styles.boardContainer}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                setPremoves([])
                            }}
                        >
                            <PlayerBanner
                                name={opponentName}
                                color={playerColor === 'w' ? 'b' : 'w'}
                                time={playerColor === 'w' ? blackTime : whiteTime}
                                isActive={turn !== playerColor}
                            />

                            <ChessBoard
                                displayChess={displayChess}
                                displayFen={displayFen}
                                ranks={ranks}
                                files={files}
                                selectedSquare={selectedSquare}
                                validMoves={validMoves}
                                lastMove={lastMove}
                                premoveSquares={premoveSquares}
                                isReviewing={isReviewing}
                                isCheck={isCheck}
                                turn={turn}
                                playerColor={playerColor}
                                showPromotion={showPromotion}
                                isPaused={isPaused}
                                pauseCountdown={pauseCountdown}
                                pieceNames={PIECE_NAME}
                                getPieceImageSrc={getPieceImageSrc}
                                onSquareClick={handleSquareClick}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onPromotionSelect={handlePromotionSelect}
                            />

                            <PlayerBanner
                                name={currentUser?.username || 'You'}
                                color={playerColor === 'w' ? 'w' : 'b'}
                                time={playerColor === 'w' ? whiteTime : blackTime}
                                isActive={turn === playerColor}
                                isBottom={true}
                            />
                        </div>

                        <ChessInfoPanel
                            selectedMode={selectedMode}
                            captured={captured}
                            whiteScore={whiteScore}
                            blackScore={blackScore}
                            playerColor={playerColor}
                            moveHistory={moveHistory}
                            moveSAN={moveSAN}
                            viewIndex={viewIndex}
                            isReviewing={isReviewing}
                            isGameOver={isGameOver}
                            pieceNames={PIECE_NAME}
                            getPieceImageSrc={getPieceImageSrc}
                            onSelectIndex={setViewIndex}
                            onResign={resignGame}
                        />
                    </div>
                )}

                {isGameOver && !hideGameOverModal && (
                    <GameOverDialog
                        winnerColor={winnerColor}
                        playerColor={playerColor}
                        gameOverReason={gameOverReason}
                        onClose={() => setHideGameOverModal(true)}
                        onPlayAgain={() => {
                            setIsGameOver(false)
                            startMatchmaking()
                        }}
                    />
                )}
            </main>
        </div>
    )
}
