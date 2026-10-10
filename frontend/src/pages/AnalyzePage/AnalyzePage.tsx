import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Chess, type Square } from 'chess.js'
import {
    Brain,
    RotateCcw,
    RotateCw,
    Search,
    ScrollText,
    SkipBack,
    ChevronLeft,
    ChevronRight,
    SkipForward,
    X,
    Swords,
} from 'lucide-react'

import ChessBoard, { type BoardArrow } from '../../components/ChessBoard/ChessBoard'
import PlayerBanner from '../../components/PlayerBanner/Playerbanner'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../context/ToastContext'
import { playSound, type SoundType } from '../../utils/sound'
import type { MatchRecord, GameAnalysisResult } from '../../utils/gameUtils'
import SimpleGameRow from '../../components/GameRow/SimpleGameRow'
import ChessSkeleton from '../../components/ChessSkeleton/ChessSkeleton'
import styles from './AnalyzePage.module.css'

function getSoundForSan(san?: string): SoundType {
    if (!san) return 'move-self'
    if (san.includes('+') || san.includes('#')) return 'move-check'
    if (san.includes('O-O')) return 'castle'
    if (san.includes('=')) return 'promote'
    if (san.includes('x')) return 'capture'
    return 'move-self'
}

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

interface EvaluationLine {
    score: number
    mate: number | null
    bestMove: string
    bestMoveSan?: string
    pv?: string[]
    pvSan?: string[]
    depth?: number
    multipv?: number
}

interface EvaluationResult {
    score: number
    mate: number | null
    bestMove?: string
    bestMoveSan?: string
    pv?: string[]
    pvSan?: string[]
    depth?: number
    lines?: EvaluationLine[]
}

function formatLineScore(score: number, mate: number | null): string {
    if (mate !== null && mate !== undefined) {
        return `M${Math.abs(mate)}`
    }
    const pawns = score / 100
    return pawns > 0 ? `+${pawns.toFixed(1)}` : `${pawns.toFixed(1)}`
}

function getCapturedPiecesAndDiff(fen: string) {
    try {
        const c = new Chess(fen)
        const board = c.board()
        const counts = {
            w: { p: 0, r: 0, n: 0, b: 0, q: 0 },
            b: { p: 0, r: 0, n: 0, b: 0, q: 0 },
        }
        for (const row of board) {
            for (const sq of row) {
                if (sq && sq.type !== 'k') {
                    counts[sq.color][sq.type]++
                }
            }
        }

        const initial = { p: 8, r: 2, n: 2, b: 2, q: 1 }
        const capturedWhite: { type: string; color: 'w' }[] = []
        const capturedBlack: { type: string; color: 'b' }[] = []

        for (const [type, count] of Object.entries(initial)) {
            const missingW = count - counts.w[type as keyof typeof initial]
            for (let i = 0; i < missingW; i++) {
                capturedWhite.push({ type, color: 'w' })
            }
            const missingB = count - counts.b[type as keyof typeof initial]
            for (let i = 0; i < missingB; i++) {
                capturedBlack.push({ type, color: 'b' })
            }
        }

        const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 }
        const whiteVal = Object.entries(counts.w).reduce(
            (sum, [t, num]) => sum + num * pieceValues[t as keyof typeof pieceValues],
            0
        )
        const blackVal = Object.entries(counts.b).reduce(
            (sum, [t, num]) => sum + num * pieceValues[t as keyof typeof pieceValues],
            0
        )

        return {
            capturedWhite,
            capturedBlack,
            whiteDiff: whiteVal > blackVal ? whiteVal - blackVal : 0,
            blackDiff: blackVal > whiteVal ? blackVal - whiteVal : 0,
        }
    } catch {
        return {
            capturedWhite: [],
            capturedBlack: [],
            whiteDiff: 0,
            blackDiff: 0,
        }
    }
}

export default function AnalyzePage() {
    const { t } = useTranslation()
    usePageTitle('page_title_interactive_analysis')
    const { id } = useParams<{ id?: string }>()
    const navigate = useNavigate()
    const { showToast } = useToast()

    // ── Board & Moves State ──
    const [moveHistory, setMoveHistory] = useState<string[]>([STARTING_FEN])
    const [moveSAN, setMoveSAN] = useState<string[]>([])
    const [moveDetails, setMoveDetails] = useState<{ from: string; to: string }[]>([])
    const [viewIndex, setViewIndex] = useState<number>(0)
    const [orientation, setOrientation] = useState<'w' | 'b'>('w')
    const [isLoadingGame, setIsLoadingGame] = useState<boolean>(Boolean(id))

    const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
    const [validMoves, setValidMoves] = useState<string[]>([])

    const currentLastMove = useMemo(() => {
        if (viewIndex === 0) return null
        return moveDetails[viewIndex - 1] ?? null
    }, [viewIndex, moveDetails])

    // Promotion handling
    const [showPromotion, setShowPromotion] = useState<boolean>(false)
    const [promotionSquare, setPromotionSquare] = useState<string | null>(null)
    const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null)

    // Players banner names and ratings
    const [whitePlayerName, setWhitePlayerName] = useState<string>('White')
    const [blackPlayerName, setBlackPlayerName] = useState<string>('Black')
    const [whiteRating, setWhiteRating] = useState<number | string | undefined>(undefined)
    const [blackRating, setBlackRating] = useState<number | string | undefined>(undefined)
    const [currentUsername, setCurrentUsername] = useState<string>('')

    // ── Engine Evaluation & Analysis State ──
    const [isEvaluating, setIsEvaluating] = useState<boolean>(false)
    const [evalInfo, setEvalInfo] = useState<{
        winChanceWhite: number
        winChanceBlack: number
        scoreText: string
        isWhiteAdvantage: boolean
        mate: number | null
        score: number
    }>({
        winChanceWhite: 50,
        winChanceBlack: 50,
        scoreText: '0.0',
        isWhiteAdvantage: true,
        mate: null,
        score: 0,
    })
    const [engineLines, setEngineLines] = useState<EvaluationLine[]>([])
    const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0)
    const [customArrows, setCustomArrows] = useState<BoardArrow[]>([])
    const [analysisData, setAnalysisData] = useState<GameAnalysisResult | null>(null)

    const evalCacheRef = useRef<Map<string, EvaluationResult>>(new Map())
    const moveListRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const prevViewIndexRef = useRef<number | null>(null)
    const isExecutingMoveRef = useRef<boolean>(false)
    const skipSoundRef = useRef<boolean>(false)

    // ── Modals State ──
    const [showPgnModal, setShowPgnModal] = useState<boolean>(false)
    const [pgnInput, setPgnInput] = useState<string>('')
    const [showGamesModal, setShowGamesModal] = useState<boolean>(false)
    const [userGames, setUserGames] = useState<MatchRecord[]>([])
    const [isLoadingGames, setIsLoadingGames] = useState<boolean>(false)
    const [gamesPage, setGamesPage] = useState<number>(1)
    const GAMES_PER_PAGE = 5

    // Current position
    const currentFen = moveHistory[viewIndex] || STARTING_FEN
    const displayChess = useMemo(() => {
        try {
            return new Chess(currentFen)
        } catch {
            return new Chess(STARTING_FEN)
        }
    }, [currentFen])

    const currentTurn = displayChess.turn()
    const isCheck = displayChess.isCheck()
    const isGameOver = displayChess.isGameOver()
    const winnerColor = displayChess.isCheckmate() ? (currentTurn === 'w' ? 'b' : 'w') : null

    // Ranks and Files according to board orientation
    const ranks = useMemo(
        () => (orientation === 'w' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8']),
        [orientation]
    )
    const files = useMemo(
        () => (orientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']),
        [orientation]
    )

    // Material difference and captured pieces
    const { capturedWhite, capturedBlack, whiteDiff, blackDiff } = useMemo(
        () => getCapturedPiecesAndDiff(currentFen),
        [currentFen]
    )

    // ── Move List Auto-Scrolling ──
    useEffect(() => {
        const container = moveListRef.current
        if (!container) return

        const active = container.querySelector(`.${styles.moveBtn}.${styles.activeMove}`) as HTMLElement | null
        if (!active) return

        const containerRect = container.getBoundingClientRect()
        const activeRect = active.getBoundingClientRect()

        const relativeTop = activeRect.top - containerRect.top + container.scrollTop
        const relativeBottom = relativeTop + activeRect.height

        const currentScroll = container.scrollTop
        const viewHeight = container.clientHeight

        if (relativeTop < currentScroll) {
            container.scrollTo({ top: Math.max(0, relativeTop - 4), behavior: 'smooth' })
        } else if (relativeBottom > currentScroll + viewHeight) {
            container.scrollTo({ top: relativeBottom - viewHeight + 4, behavior: 'smooth' })
        }
    }, [viewIndex])

    // ── Board Move Sounds on Step Navigation ──
    useEffect(() => {
        if (prevViewIndexRef.current === null) {
            prevViewIndexRef.current = viewIndex
            return
        }
        if (prevViewIndexRef.current === viewIndex) return

        const prev = prevViewIndexRef.current
        prevViewIndexRef.current = viewIndex

        if (skipSoundRef.current) {
            skipSoundRef.current = false
            return
        }

        if (isExecutingMoveRef.current) {
            isExecutingMoveRef.current = false
            return
        }

        if (viewIndex === 0) {
            playSound('move-self')
            return
        }

        if (viewIndex > prev) {
            const san = moveSAN[viewIndex - 1]
            playSound(getSoundForSan(san))
        } else {
            playSound('move-self')
        }
    }, [viewIndex, moveSAN])

    // ── Keyboard Arrow Navigation ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setViewIndex((prev) => Math.max(0, prev - 1))
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                setViewIndex((prev) => Math.min(moveHistory.length - 1, prev + 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setViewIndex(moveHistory.length - 1)
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setViewIndex(0)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [moveHistory.length])

    // Clear best-move suggestion arrow when navigating moves
    useEffect(() => {
        setCustomArrows([])
    }, [viewIndex])

    // ── Position Evaluation Logic ──
    const applyEvaluation = useCallback((data: EvaluationResult, fen: string) => {
        try {
            const c = new Chess(fen)
            if (c.isCheckmate()) {
                const isWhiteWinner = c.turn() === 'b'
                setEvalInfo({
                    winChanceWhite: isWhiteWinner ? 100 : 0,
                    winChanceBlack: isWhiteWinner ? 0 : 100,
                    scoreText: isWhiteWinner ? '1-0' : '0-1',
                    isWhiteAdvantage: isWhiteWinner,
                    mate: 0,
                    score: isWhiteWinner ? 10000 : -10000,
                })
                setCustomArrows([])
                setEngineLines([])
                setSelectedLineIndex(0)
                return
            }

            if (c.isDraw()) {
                setEvalInfo({
                    winChanceWhite: 50,
                    winChanceBlack: 50,
                    scoreText: '½-½',
                    isWhiteAdvantage: true,
                    mate: null,
                    score: 0,
                })
                setCustomArrows([])
                setEngineLines([])
                setSelectedLineIndex(0)
                return
            }

            let scoreText = '0.0'
            let winChanceWhite = 50
            let isWhiteAdvantage = true

            if (data.mate !== null && data.mate !== undefined) {
                scoreText = `M${Math.abs(data.mate)}`
                isWhiteAdvantage = data.mate > 0
                winChanceWhite = data.mate > 0 ? 100 : 0
            } else {
                const pawns = data.score / 100
                scoreText = pawns > 0 ? `+${pawns.toFixed(1)}` : `${pawns.toFixed(1)}`
                isWhiteAdvantage = data.score >= 0
                winChanceWhite = Math.max(
                    2,
                    Math.min(98, Math.round(50 + 50 * (2 / (1 + Math.exp(-0.00368208 * data.score)) - 1)))
                )
            }

            setEvalInfo({
                winChanceWhite,
                winChanceBlack: 100 - winChanceWhite,
                scoreText,
                isWhiteAdvantage,
                mate: data.mate ?? null,
                score: data.score,
            })

            const lines: EvaluationLine[] = (data.lines && data.lines.length > 0)
                ? data.lines
                : (data.pvSan && data.pvSan.length > 0)
                    ? [{
                        score: data.score,
                        mate: data.mate ?? null,
                        bestMove: data.bestMove || '',
                        bestMoveSan: data.bestMoveSan || data.pvSan[0],
                        pvSan: data.pvSan,
                        depth: data.depth || 14,
                        multipv: 1,
                    }]
                    : []

            setEngineLines(lines)
            setSelectedLineIndex(0)

            const primaryMove = lines[0]?.bestMove || data.bestMove
            if (primaryMove && primaryMove.length >= 4) {
                setCustomArrows([
                    {
                        from: primaryMove.substring(0, 2),
                        to: primaryMove.substring(2, 4),
                        color: '#22c55e',
                    },
                ])
            } else {
                setCustomArrows([])
            }
        } catch {
            // ignore
        }
    }, [])

    const handleSelectEngineLine = (index: number) => {
        setSelectedLineIndex(index)
        const line = engineLines[index]
        if (line && line.bestMove && line.bestMove.length >= 4) {
            setCustomArrows([
                {
                    from: line.bestMove.substring(0, 2),
                    to: line.bestMove.substring(2, 4),
                    color: '#22c55e',
                },
            ])
        }
    }

    useEffect(() => {
        // 1. Check if position is game over
        if (displayChess.isGameOver()) {
            if (displayChess.isCheckmate()) {
                const isWhiteWinner = displayChess.turn() === 'b'
                setEvalInfo({
                    winChanceWhite: isWhiteWinner ? 100 : 0,
                    winChanceBlack: isWhiteWinner ? 0 : 100,
                    scoreText: isWhiteWinner ? '1-0' : '0-1',
                    isWhiteAdvantage: isWhiteWinner,
                    mate: 0,
                    score: isWhiteWinner ? 10000 : -10000,
                })
            } else {
                setEvalInfo({
                    winChanceWhite: 50,
                    winChanceBlack: 50,
                    scoreText: '½-½',
                    isWhiteAdvantage: true,
                    mate: null,
                    score: 0,
                })
            }
            setCustomArrows([])
            setEngineLines([])
            setSelectedLineIndex(0)
            return
        }

        let isCancelled = false

        // 2. Check if cached in memory
        const cached = evalCacheRef.current.get(currentFen)
        if (cached) {
            applyEvaluation(cached, currentFen)
            return
        }

        // 3. Debounce live position evaluation (fetches all engine lines)
        const timer = setTimeout(async () => {
            try {
                setIsEvaluating(true)
                const token = localStorage.getItem('token')
                const res = await fetch('/api/game/evaluate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ fen: currentFen, depth: 14 }),
                })
                if (isCancelled) return
                if (res.ok) {
                    const data: EvaluationResult = await res.json()
                    evalCacheRef.current.set(currentFen, data)
                    if (!isCancelled) {
                        applyEvaluation(data, currentFen)
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error('Failed to evaluate position:', err)
                }
            } finally {
                if (!isCancelled) {
                    setIsEvaluating(false)
                }
            }
        }, 150)

        return () => {
            isCancelled = true
            clearTimeout(timer)
        }
    }, [currentFen, displayChess, applyEvaluation])

    // ── Initial Load by :id (if provided in route) ──
    useEffect(() => {
        if (!id) return
        let isCancelled = false

        const fetchGameById = async () => {
            try {
                setIsLoadingGame(true)
                setIsEvaluating(true)
                const token = localStorage.getItem('token')
                const [matchRes, analysisRes] = await Promise.all([
                    fetch(`/api/game/${id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    }),
                    fetch(`/api/game/analyze/${id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    }),
                ])

                if (isCancelled) return

                if (matchRes.ok) {
                    const matchData: MatchRecord = await matchRes.json()
                    if (isCancelled) return
                    if (matchData.white?.username) setWhitePlayerName(matchData.white.username)
                    if (matchData.black?.username) setBlackPlayerName(matchData.black.username)
                    if (matchData.white?.rating !== undefined && matchData.white?.rating !== null) {
                        setWhiteRating(matchData.white.rating)
                    }
                    if (matchData.black?.rating !== undefined && matchData.black?.rating !== null) {
                        setBlackRating(matchData.black.rating)
                    }

                    if (matchData.pgn) {
                        loadPgnString(matchData.pgn, false, false)
                    }
                }

                if (analysisRes.ok) {
                    const data: GameAnalysisResult = await analysisRes.json()
                    if (isCancelled) return
                    setAnalysisData(data)
                }
            } catch (err) {
                if (isCancelled) return
                console.error('Failed to load game analysis for id:', id, err)
                showToast('error', t('game_not_found'))
            } finally {
                if (!isCancelled) {
                    setIsEvaluating(false)
                    setIsLoadingGame(false)
                }
            }
        }

        fetchGameById()

        return () => {
            isCancelled = true
        }
    }, [id])

    // ── Interactive Piece Movement ──
    const executeMove = (from: string, to: string, promotion?: string) => {
        try {
            const currentPositionChess = new Chess(moveHistory[viewIndex])
            const moveRes = currentPositionChess.move({ from, to, promotion: promotion || 'q' })
            if (!moveRes) {
                playSound('illegal')
                return false
            }

            // Play appropriate chess sound
            if (moveRes.captured) {
                playSound('capture')
            } else if (currentPositionChess.isCheck()) {
                playSound('move-check')
            } else if (moveRes.flags.includes('k') || moveRes.flags.includes('q')) {
                playSound('castle')
            } else if (promotion) {
                playSound('promote')
            } else {
                playSound('move-self')
            }

            isExecutingMoveRef.current = true

            const nextFen = currentPositionChess.fen()
            const newHistory = moveHistory.slice(0, viewIndex + 1).concat(nextFen)
            const newSAN = moveSAN.slice(0, viewIndex).concat(moveRes.san)
            const newDetails = moveDetails.slice(0, viewIndex).concat({ from, to })
            const nextIdx = viewIndex + 1

            setMoveHistory(newHistory)
            setMoveSAN(newSAN)
            setMoveDetails(newDetails)
            setViewIndex(nextIdx)
            setSelectedSquare(null)
            setValidMoves([])
            setShowPromotion(false)
            setPromotionSquare(null)
            setPendingMove(null)

            return true
        } catch {
            playSound('illegal')
            return false
        }
    }

    const handleSquareClick = (sq: string) => {
        if (!selectedSquare) {
            // Selecting square
            const piece = displayChess.get(sq as Square)
            if (piece && piece.color === currentTurn) {
                setSelectedSquare(sq)
                const moves = displayChess.moves({ square: sq as Square, verbose: true })
                setValidMoves(moves.map((m) => m.to))
            }
            return
        }

        // Clicking same square unselects
        if (selectedSquare === sq) {
            setSelectedSquare(null)
            setValidMoves([])
            return
        }

        // Clicking another piece of current turn switches selection
        const clickedPiece = displayChess.get(sq as Square)
        if (clickedPiece && clickedPiece.color === currentTurn) {
            setSelectedSquare(sq)
            const moves = displayChess.moves({ square: sq as Square, verbose: true })
            setValidMoves(moves.map((m) => m.to))
            return
        }

        // Check if clicked square is a valid target move
        if (validMoves.includes(sq)) {
            const piece = displayChess.get(selectedSquare as Square)
            const isPawn = piece?.type === 'p'
            const isPromoting =
                isPawn &&
                ((currentTurn === 'w' && sq[1] === '8') || (currentTurn === 'b' && sq[1] === '1'))

            if (isPromoting) {
                setPendingMove({ from: selectedSquare, to: sq })
                setPromotionSquare(sq)
                setShowPromotion(true)
                return
            }

            executeMove(selectedSquare, sq)
        } else {
            setSelectedSquare(null)
            setValidMoves([])
        }
    }

    const handleSquareSelect = (sq: string) => {
        const piece = displayChess.get(sq as Square)
        if (piece && piece.color === currentTurn) {
            setSelectedSquare(sq)
            const moves = displayChess.moves({ square: sq as Square, verbose: true })
            setValidMoves(moves.map((m) => m.to))
        } else {
            setSelectedSquare(null)
            setValidMoves([])
        }
    }

    const handlePieceDrop = (fromSq: string, toSq: string) => {
        if (!fromSq || !toSq || fromSq === toSq) return

        const piece = displayChess.get(fromSq as Square)
        if (!piece || piece.color !== currentTurn) return

        const isPawn = piece.type === 'p'
        const isPromoting =
            isPawn &&
            ((currentTurn === 'w' && toSq[1] === '8') || (currentTurn === 'b' && toSq[1] === '1'))

        const moves = displayChess.moves({ square: fromSq as Square, verbose: true })
        const isValid = moves.some((m) => m.to === toSq)

        if (!isValid) return

        if (isPromoting) {
            setPendingMove({ from: fromSq, to: toSq })
            setPromotionSquare(toSq)
            setShowPromotion(true)
            return
        }

        executeMove(fromSq, toSq)
    }

    const handlePromotionSelect = (pieceCode: string) => {
        if (pendingMove) {
            executeMove(pendingMove.from, pendingMove.to, pieceCode.toLowerCase())
        }
        setShowPromotion(false)
        setPromotionSquare(null)
        setPendingMove(null)
    }

    const handlePromotionCancel = () => {
        setShowPromotion(false)
        setPromotionSquare(null)
        setPendingMove(null)
    }

    // ── Load PGN Logic ──
    const loadPgnString = (pgnString: string, requestFullAnalysis = true, showNotification = true) => {
        skipSoundRef.current = true
        try {
            const parser = new Chess()
            const trimmed = pgnString.trim()

            let loaded = false
            try {
                parser.loadPgn(trimmed)
                loaded = true
            } catch {
                try {
                    parser.load(trimmed)
                    loaded = true
                } catch {
                    loaded = false
                }
            }

            if (!loaded) {
                showToast('error', t('invalid_pgn'))
                return false
            }

            const headers = parser.header()
            if (headers['White']) setWhitePlayerName(headers['White'])
            if (headers['Black']) setBlackPlayerName(headers['Black'])
            setWhiteRating(headers['WhiteElo'] || undefined)
            setBlackRating(headers['BlackElo'] || undefined)

            const historyMoves = parser.history({ verbose: true })
            const fens: string[] = [STARTING_FEN]
            const sans: string[] = []
            const details: { from: string; to: string }[] = []

            const replay = new Chess()
            for (const m of historyMoves) {
                replay.move(m)
                fens.push(replay.fen())
                sans.push(m.san)
                details.push({ from: m.from, to: m.to })
            }

            setMoveHistory(fens)
            setMoveSAN(sans)
            setMoveDetails(details)
            setViewIndex(fens.length - 1)
            setSelectedSquare(null)
            setValidMoves([])
            setShowPgnModal(false)
            setPgnInput('')
            if (showNotification) {
                showToast('success', t('pgn_loaded_success'))
            }

            if (requestFullAnalysis) {
                fetchFullPgnAnalysis(trimmed)
            }

            return true
        } catch (err) {
            console.error('Failed to parse PGN:', err)
            showToast('error', t('invalid_pgn'))
            return false
        }
    }

    const fetchFullPgnAnalysis = async (pgn: string) => {
        try {
            setIsEvaluating(true)
            const token = localStorage.getItem('token')
            const res = await fetch('/api/game/analyze-pgn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ pgn, depth: 14 }),
            })
            if (res.ok) {
                const data: GameAnalysisResult = await res.json()
                setAnalysisData(data)
            }
        } catch (err) {
            console.error('Failed to run full PGN analysis:', err)
        } finally {
            setIsEvaluating(false)
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            if (content) {
                loadPgnString(content)
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    // ── Analyze Past Games Modal ──
    const openGamesModal = async () => {
        setShowGamesModal(true)
        setIsLoadingGames(true)
        setGamesPage(1)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                setIsLoadingGames(false)
                return
            }
            const meRes = await fetch('/api/users/me', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!meRes.ok) return
            const me = await meRes.json()
            setCurrentUsername(me.username)

            const gamesRes = await fetch(`/api/game/history/${me.username}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (gamesRes.ok) {
                const games: MatchRecord[] = await gamesRes.json()
                setUserGames(games)
            }
        } catch (err) {
            console.error('Failed to load past games:', err)
        } finally {
            setIsLoadingGames(false)
        }
    }

    const handleSelectPastGame = (game: MatchRecord) => {
        setShowGamesModal(false)
        skipSoundRef.current = true
        if (game.white?.username) setWhitePlayerName(game.white.username)
        if (game.black?.username) setBlackPlayerName(game.black.username)
        if (game.white?.rating !== undefined && game.white?.rating !== null) {
            setWhiteRating(game.white.rating)
        } else {
            setWhiteRating(undefined)
        }
        if (game.black?.rating !== undefined && game.black?.rating !== null) {
            setBlackRating(game.black.rating)
        } else {
            setBlackRating(undefined)
        }

        if (game.pgn) {
            loadPgnString(game.pgn, true)
        } else if (game.id) {
            navigate(`/analyze/${game.id}`)
        }
    }

    // ── Reset Board ──
    const handleReset = () => {
        skipSoundRef.current = true
        setMoveHistory([STARTING_FEN])
        setMoveSAN([])
        setMoveDetails([])
        setViewIndex(0)
        setSelectedSquare(null)
        setValidMoves([])
        setShowPromotion(false)
        setPromotionSquare(null)
        setPendingMove(null)
        setWhitePlayerName('White')
        setBlackPlayerName('Black')
        setWhiteRating(undefined)
        setBlackRating(undefined)
        setAnalysisData(null)
        setCustomArrows([])
        setEngineLines([])
        setSelectedLineIndex(0)
        setEvalInfo({
            winChanceWhite: 50,
            winChanceBlack: 50,
            scoreText: '0.0',
            isWhiteAdvantage: true,
            mate: null,
            score: 0,
        })
    }

    // Flip board orientation
    const handleFlipBoard = () => {
        setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))
    }

    // Eval bar white height percentage (fixed: White is always at bottom, Black is always at top)
    const whiteBarHeight = evalInfo.winChanceWhite

    // Move rows grouping for move history log
    const halfMoves = moveHistory.length - 1
    const moveRows = useMemo(() => {
        const rows = []
        for (let i = 0; i < halfMoves; i += 2) {
            rows.push({
                num: Math.floor(i / 2) + 1,
                whiteIdx: i,
                blackIdx: i + 1,
                whiteSan: moveSAN[i] ?? '',
                blackSan: moveSAN[i + 1] ?? '',
            })
        }
        return rows
    }, [halfMoves, moveSAN])

    if (isLoadingGame) {
        return (
            <div className={styles.container}>
                <main className={styles.main}>
                    <div className={styles.playArea}>
                        <ChessSkeleton mode="analyze" />
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.playArea}>
                    {/* ── Left Board & Eval Bar Area ── */}
                    <div className={styles.boardAreaWithEval}>
                        {/* Evaluation Bar */}
                        <div className={styles.evalBarWrapper}>
                            <span className={styles.evalSideHint}>B</span>
                            <div className={styles.evalBarContainer}>
                                <div
                                    className={styles.evalBarWhite}
                                    style={{ height: `${whiteBarHeight}%` }}
                                />
                                <div className={styles.evalBarBlack} />

                                <span
                                    className={`${styles.evalBarLabel} ${
                                        whiteBarHeight >= 50 ? styles.evalWhiteSide : styles.evalBlackSide
                                    }`}
                                >
                                    {evalInfo.scoreText}
                                </span>
                            </div>
                            <span className={styles.evalSideHint}>W</span>
                        </div>

                        {/* Chess Board Container with Top and Bottom Player Banners */}
                        <div
                            className={styles.boardContainer}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                if (showPromotion) {
                                    handlePromotionCancel()
                                }
                            }}
                        >
                            {/* Top Banner (Black if normal orientation, White if flipped) */}
                            <PlayerBanner
                                name={orientation === 'w' ? blackPlayerName : whitePlayerName}
                                username={orientation === 'w' ? blackPlayerName : whitePlayerName}
                                rating={orientation === 'w' ? blackRating : whiteRating}
                                color={orientation === 'w' ? 'b' : 'w'}
                                time={0}
                                isActive={currentTurn === (orientation === 'w' ? 'b' : 'w')}
                                hideClock={true}
                                capturedPieces={orientation === 'w' ? capturedWhite : capturedBlack}
                                materialDiff={orientation === 'w' ? blackDiff : whiteDiff}
                            />

                            {/* Main Interactive ChessBoard */}
                            <ChessBoard
                                displayChess={displayChess}
                                displayFen={currentFen}
                                ranks={ranks}
                                files={files}
                                selectedSquare={selectedSquare}
                                validMoves={validMoves}
                                lastMove={currentLastMove}
                                premoveSquares={new Set()}
                                isReviewing={false}
                                isCheck={isCheck}
                                turn={currentTurn}
                                playerColor={currentTurn}
                                showPromotion={showPromotion}
                                promotionSquare={promotionSquare}
                                isPaused={false}
                                pauseCountdown={null}
                                onSquareClick={handleSquareClick}
                                onSquareSelect={handleSquareSelect}
                                onPieceDrop={handlePieceDrop}
                                onPromotionSelect={handlePromotionSelect}
                                onPromotionCancel={handlePromotionCancel}
                                isGameOver={isGameOver}
                                isViewer={false}
                                winnerColor={winnerColor}
                                customArrows={customArrows}
                            />

                            {/* Bottom Banner (White if normal orientation, Black if flipped) */}
                            <PlayerBanner
                                name={orientation === 'w' ? whitePlayerName : blackPlayerName}
                                username={orientation === 'w' ? whitePlayerName : blackPlayerName}
                                rating={orientation === 'w' ? whiteRating : blackRating}
                                color={orientation === 'w' ? 'w' : 'b'}
                                time={0}
                                isActive={currentTurn === (orientation === 'w' ? 'w' : 'b')}
                                isBottom={true}
                                hideClock={true}
                                capturedPieces={orientation === 'w' ? capturedBlack : capturedWhite}
                                materialDiff={orientation === 'w' ? whiteDiff : blackDiff}
                            />
                        </div>
                    </div>

                    {/* ── Right Side Info Panel ── */}
                    <div className={styles.infoPanel}>
                        <div className={styles.panelHeader}>
                            <h3>
                                <Brain size={18} />
                                {t('analysis_board')}
                            </h3>
                            <span className={styles.modeBadge}>
                                {analysisData
                                    ? `Acc: W ${analysisData.accuracy.white}% • B ${analysisData.accuracy.black}%`
                                    : t('interactive_analysis')}
                            </span>
                        </div>

                        {/* Engine Live Telemetry & Best Lines */}
                        <div className={styles.engineBanner}>
                            <div className={styles.engineBannerTop}>
                                <div className={styles.engineScoreGroup}>
                                    <span className={styles.engineScore}>{evalInfo.scoreText}</span>
                                    {engineLines[selectedLineIndex] && (
                                        <span className={styles.depthTag}>
                                            depth {engineLines[selectedLineIndex].depth || 14}
                                        </span>
                                    )}
                                </div>
                                <span className={styles.engineStatus}>
                                    {isEvaluating ? t('evaluating') : (
                                        displayChess.isCheckmate()
                                            ? t('checkmate')
                                            : displayChess.isDraw()
                                            ? t('draw')
                                            : evalInfo.score > 200
                                            ? t('white_winning', 'White is winning')
                                            : evalInfo.score < -200
                                            ? t('black_winning', 'Black is winning')
                                            : t('equal_position', 'Equal position')
                                    )}
                                </span>
                            </div>

                            {engineLines.length > 0 && (
                                <div className={styles.engineLinesList}>
                                    {engineLines.map((line, idx) => {
                                        const isSelected = selectedLineIndex === idx
                                        const lineScore = formatLineScore(line.score, line.mate)
                                        const movesStr = line.pvSan && line.pvSan.length > 0
                                            ? line.pvSan.slice(0, 8).join(' ')
                                            : line.bestMoveSan || line.bestMove
                                        return (
                                            <div
                                                key={idx}
                                                className={`${styles.engineLineItem} ${isSelected ? styles.activeLine : ''}`}
                                                onClick={() => handleSelectEngineLine(idx)}
                                                title={t('click_to_view_line', 'Click to view engine arrow')}
                                            >
                                                <span className={styles.engineLineRank}>{idx + 1}</span>
                                                <span className={styles.engineLineScore}>{lineScore}</span>
                                                <span className={styles.engineLineMoves}>{movesStr}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Move Log History Container */}
                        <div className={styles.moveLogWrapper}>
                            <div className={styles.moveList} ref={moveListRef}>
                                {moveRows.length === 0 ? (
                                    <div className={styles.emptyHistory}>
                                        <div className={styles.emptyHistoryIcon}>
                                            <ScrollText size={36} aria-hidden="true" />
                                        </div>
                                        <span className={styles.emptyHistoryTitle}>
                                            {t('no_moves_yet')}
                                        </span>
                                        <span className={styles.emptyHistorySubtitle}>
                                            {t('moves_appear_here')}
                                        </span>
                                    </div>
                                ) : (
                                    moveRows.map((row) => {
                                        const whiteActive = viewIndex === row.whiteIdx + 1
                                        const blackActive = viewIndex === row.blackIdx + 1

                                        const whiteAnalysis = analysisData?.positions[row.whiteIdx]
                                        const blackAnalysis = analysisData?.positions[row.blackIdx]

                                        const getBadge = (cls?: string) => {
                                            switch (cls) {
                                                case 'brilliant': return { glyph: '!!', color: '#06b6d4' }
                                                case 'great': return { glyph: '!', color: '#0ea5e9' }
                                                case 'best': return { glyph: '★', color: '#10b981' }
                                                case 'inaccuracy': return { glyph: '?!', color: '#eab308' }
                                                case 'mistake': return { glyph: '?', color: '#f97316' }
                                                case 'blunder': return { glyph: '??', color: '#ef4444' }
                                                default: return null
                                            }
                                        }

                                        const whiteBadge = getBadge(whiteAnalysis?.classification)
                                        const blackBadge = getBadge(blackAnalysis?.classification)

                                        return (
                                            <div key={row.num} className={styles.moveRow}>
                                                <span className={styles.moveRowNum}>{row.num}.</span>
                                                <button
                                                    type="button"
                                                    className={`${styles.moveBtn} ${whiteActive ? styles.activeMove : ''}`}
                                                    onClick={() => setViewIndex(row.whiteIdx + 1)}
                                                >
                                                    <span>{row.whiteSan}</span>
                                                    {whiteBadge && (
                                                        <span
                                                            style={{
                                                                fontSize: 10,
                                                                fontWeight: 800,
                                                                color: whiteBadge.color,
                                                                marginLeft: 4,
                                                            }}
                                                            title={whiteAnalysis?.classification}
                                                        >
                                                            {whiteBadge.glyph}
                                                        </span>
                                                    )}
                                                </button>
                                                {row.blackSan ? (
                                                    <button
                                                        type="button"
                                                        className={`${styles.moveBtn} ${blackActive ? styles.activeMove : ''}`}
                                                        onClick={() => setViewIndex(row.blackIdx + 1)}
                                                    >
                                                        <span>{row.blackSan}</span>
                                                        {blackBadge && (
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 800,
                                                                    color: blackBadge.color,
                                                                    marginLeft: 4,
                                                                }}
                                                                title={blackAnalysis?.classification}
                                                            >
                                                                {blackBadge.glyph}
                                                            </span>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className={styles.emptyMoveBtn} />
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* Move Navigation Bar */}
                            <div className={styles.moveNavRow}>
                                <button
                                    type="button"
                                    className={styles.navBtn}
                                    title={t('start_nav', 'Start')}
                                    onClick={() => setViewIndex(0)}
                                    disabled={viewIndex === 0}
                                >
                                    <SkipBack size={16} />
                                </button>
                                <button
                                    type="button"
                                    className={styles.navBtn}
                                    title={t('prev_nav', 'Previous')}
                                    onClick={() => setViewIndex((prev) => Math.max(0, prev - 1))}
                                    disabled={viewIndex === 0}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    className={styles.navBtn}
                                    title={t('next_nav', 'Next')}
                                    onClick={() => setViewIndex((prev) => Math.min(moveHistory.length - 1, prev + 1))}
                                    disabled={viewIndex >= moveHistory.length - 1}
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    className={styles.navBtn}
                                    title={t('end_nav', 'End')}
                                    onClick={() => setViewIndex(moveHistory.length - 1)}
                                    disabled={viewIndex >= moveHistory.length - 1}
                                >
                                    <SkipForward size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className={styles.gameActions}>
                            <div className={styles.actionRow}>
                                <button
                                    type="button"
                                    className={styles.actionBtnPrimary}
                                    onClick={() => setShowPgnModal(true)}
                                    title={t('load_pgn')}
                                >
                                    <ScrollText size={15} />
                                    {t('load_pgn')}
                                </button>

                                <button
                                    type="button"
                                    className={styles.actionBtnNeutral}
                                    onClick={openGamesModal}
                                    title={t('analyze_existing_game')}
                                >
                                    <Search size={15} />
                                    {t('analyze_existing_game')}
                                </button>
                            </div>

                            <div className={styles.actionRow}>
                                <button
                                    type="button"
                                    className={styles.actionBtnNeutral}
                                    onClick={handleFlipBoard}
                                    title={t('flip_board')}
                                >
                                    <RotateCw size={15} />
                                    {t('flip_board')}
                                </button>

                                <button
                                    type="button"
                                    className={styles.actionBtnDanger}
                                    onClick={handleReset}
                                    title={t('reset_board')}
                                >
                                    <RotateCcw size={15} />
                                    {t('reset_board')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hidden File Input for Native File Explorer PGN Selection */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pgn,.txt"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                />

                {/* ── Modal: Load PGN / Upload ── */}
                {showPgnModal && (
                    <div className={styles.modalBackdrop} onClick={() => setShowPgnModal(false)}>
                        <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3>
                                    <ScrollText size={18} />
                                    {t('load_pgn')}
                                </h3>
                                <button
                                    type="button"
                                    className={styles.modalCloseBtn}
                                    onClick={() => setShowPgnModal(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <div
                                    className={styles.pgnDropzone}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ScrollText size={32} color="#38BDF8" />
                                    <span style={{ fontWeight: 600, color: '#F1F5F9' }}>
                                        {t('choose_pgn_file')}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                        Supports standard .pgn and text notation files
                                    </span>
                                </div>

                                <textarea
                                    className={styles.pgnTextarea}
                                    placeholder={t('or_paste_pgn')}
                                    value={pgnInput}
                                    onChange={(e) => setPgnInput(e.target.value)}
                                />
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.submitBtn}
                                    disabled={!pgnInput.trim()}
                                    onClick={() => loadPgnString(pgnInput, true)}
                                >
                                    {t('load_and_analyze')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Modal: Analyze Existing Games ── */}
                {showGamesModal && (
                    <div className={styles.modalBackdrop} onClick={() => setShowGamesModal(false)}>
                        <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3>
                                    <Swords size={18} />
                                    {t('select_game_to_analyze')}
                                </h3>
                                <button
                                    type="button"
                                    className={styles.modalCloseBtn}
                                    onClick={() => setShowGamesModal(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                {isLoadingGames ? (
                                    <div className={styles.emptyMoves}>
                                        <p>{t('loading', 'Loading games...')}</p>
                                    </div>
                                ) : userGames.length === 0 ? (
                                    <div className={styles.emptyMoves}>
                                        <p>{t('no_games_found')}</p>
                                    </div>
                                ) : (
                                    <div className={styles.gamesList}>
                                        {userGames
                                            .slice(
                                                (gamesPage - 1) * GAMES_PER_PAGE,
                                                gamesPage * GAMES_PER_PAGE
                                            )
                                            .map((game) => (
                                                <SimpleGameRow
                                                    key={game.id}
                                                    match={game}
                                                    currentUsername={currentUsername}
                                                    onSelect={handleSelectPastGame}
                                                />
                                            ))}
                                    </div>
                                )}

                                {!isLoadingGames && userGames.length > GAMES_PER_PAGE && (
                                    <div className={styles.modalPagination}>
                                        <button
                                            type="button"
                                            className={styles.pageBtn}
                                            disabled={gamesPage <= 1}
                                            onClick={() => setGamesPage((p) => Math.max(1, p - 1))}
                                        >
                                            ← {t('prev_nav', 'Prev')}
                                        </button>
                                        <span className={styles.pageInfo}>
                                            {gamesPage} / {Math.ceil(userGames.length / GAMES_PER_PAGE)}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.pageBtn}
                                            disabled={
                                                gamesPage >= Math.ceil(userGames.length / GAMES_PER_PAGE)
                                            }
                                            onClick={() =>
                                                setGamesPage((p) =>
                                                    Math.min(
                                                        Math.ceil(userGames.length / GAMES_PER_PAGE),
                                                        p + 1
                                                    )
                                                )
                                            }
                                        >
                                            {t('next_nav', 'Next')} →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

