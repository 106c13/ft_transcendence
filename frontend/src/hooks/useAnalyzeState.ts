import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Chess } from 'chess.js'
import { useToast } from '../context/ToastContext'
import { playSound } from '../utils/sound'
import type { MatchRecord, GameAnalysisResult } from '../utils/gameUtils'
import {
    STARTING_FEN,
    getSoundForSan,
    getCapturedPiecesAndDiff,
} from '../utils/analyzeUtils'

interface UseAnalyzeStateParams {
    gameId?: string
    onResetEngine?: () => void
}

export function useAnalyzeState({
    gameId,
    onResetEngine,
}: UseAnalyzeStateParams = {}) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { showToast } = useToast()

    // Board & Moves History
    const [moveHistory, setMoveHistory] = useState<string[]>([STARTING_FEN])
    const [moveSAN, setMoveSAN] = useState<string[]>([])
    const [moveDetails, setMoveDetails] = useState<{ from: string; to: string }[]>([])
    const [viewIndex, setViewIndex] = useState<number>(0)
    const [orientation, setOrientation] = useState<'w' | 'b'>('w')
    const [isLoadingGame, setIsLoadingGame] = useState<boolean>(Boolean(gameId))

    // Player Information
    const [whitePlayerName, setWhitePlayerName] = useState<string>('White')
    const [blackPlayerName, setBlackPlayerName] = useState<string>('Black')
    const [whiteRating, setWhiteRating] = useState<number | string | undefined>(undefined)
    const [blackRating, setBlackRating] = useState<number | string | undefined>(undefined)

    // Full Game Analysis Data
    const [analysisData, setAnalysisData] = useState<GameAnalysisResult | null>(null)

    // Refs
    const moveListRef = useRef<HTMLDivElement>(null)
    const prevViewIndexRef = useRef<number | null>(null)
    const isExecutingMoveRef = useRef<boolean>(false)
    const skipSoundRef = useRef<boolean>(false)

    // Current Chess Board derived from active ply
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
    const winnerColor: 'w' | 'b' | null = displayChess.isCheckmate() ? (currentTurn === 'w' ? 'b' : 'w') : null

    const currentLastMove = useMemo(() => {
        if (viewIndex === 0) return null
        return moveDetails[viewIndex - 1] ?? null
    }, [viewIndex, moveDetails])

    const ranks = useMemo(
        () => (orientation === 'w' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8']),
        [orientation]
    )
    const files = useMemo(
        () => (orientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']),
        [orientation]
    )

    const { capturedWhite, capturedBlack, whiteDiff, blackDiff } = useMemo(
        () => getCapturedPiecesAndDiff(currentFen),
        [currentFen]
    )

    // Player Banner Data based on Orientation
    const topBanner = useMemo(() => ({
        name: orientation === 'w' ? blackPlayerName : whitePlayerName,
        username: orientation === 'w' ? blackPlayerName : whitePlayerName,
        rating: orientation === 'w' ? blackRating : whiteRating,
        color: (orientation === 'w' ? 'b' : 'w') as 'w' | 'b',
        capturedPieces: orientation === 'w' ? capturedWhite : capturedBlack,
        materialDiff: orientation === 'w' ? blackDiff : whiteDiff,
    }), [orientation, blackPlayerName, whitePlayerName, blackRating, whiteRating, capturedWhite, capturedBlack, blackDiff, whiteDiff])

    const bottomBanner = useMemo(() => ({
        name: orientation === 'w' ? whitePlayerName : blackPlayerName,
        username: orientation === 'w' ? whitePlayerName : blackPlayerName,
        rating: orientation === 'w' ? whiteRating : blackRating,
        color: (orientation === 'w' ? 'w' : 'b') as 'w' | 'b',
        capturedPieces: orientation === 'w' ? capturedBlack : capturedWhite,
        materialDiff: orientation === 'w' ? whiteDiff : blackDiff,
    }), [orientation, whitePlayerName, blackPlayerName, whiteRating, blackRating, capturedBlack, capturedWhite, whiteDiff, blackDiff])

    // Move List Auto-Scrolling
    useEffect(() => {
        const container = moveListRef.current
        if (!container) return

        const active = container.querySelector('[data-active-move="true"]') as HTMLElement | null
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

    // Move Sound Playback on Navigation
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

    // Keyboard Arrow Navigation
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

    // PGN Full Analysis Fetching
    const fetchFullPgnAnalysis = useCallback(async (pgn: string) => {
        try {
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
        }
    }, [])

    // Load PGN String
    const loadPgnString = useCallback((
        pgnString: string,
        requestFullAnalysis = true,
        showNotification = true
    ): boolean => {
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
    }, [t, showToast, fetchFullPgnAnalysis])

    // Load game by route param :id
    useEffect(() => {
        if (!gameId) return
        let isCancelled = false

        const fetchGameById = async () => {
            try {
                setIsLoadingGame(true)
                const token = localStorage.getItem('token')
                const [matchRes, analysisRes] = await Promise.all([
                    fetch(`/api/game/${gameId}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    }),
                    fetch(`/api/game/analyze/${gameId}`, {
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
                console.error('Failed to load game analysis for id:', gameId, err)
                showToast('error', t('game_not_found'))
            } finally {
                if (!isCancelled) {
                    setIsLoadingGame(false)
                }
            }
        }

        fetchGameById()

        return () => {
            isCancelled = true
        }
    }, [gameId, t, showToast, loadPgnString])

    // Execute Move locally on the active position branch
    const executeMove = useCallback((from: string, to: string, promotion?: string): boolean => {
        try {
            const currentPositionChess = new Chess(moveHistory[viewIndex])
            const moveRes = currentPositionChess.move({ from, to, promotion: promotion || 'q' })
            if (!moveRes) {
                playSound('illegal')
                return false
            }

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

            return true
        } catch {
            playSound('illegal')
            return false
        }
    }, [moveHistory, moveSAN, moveDetails, viewIndex])

    // Past game selection
    const handleSelectPastGame = useCallback((game: MatchRecord) => {
        skipSoundRef.current = true
        if (game.white?.username) setWhitePlayerName(game.white.username)
        if (game.black?.username) setBlackPlayerName(game.black.username)
        setWhiteRating(game.white?.rating ?? undefined)
        setBlackRating(game.black?.rating ?? undefined)

        if (game.pgn) {
            loadPgnString(game.pgn, true)
        } else if (game.id) {
            navigate(`/analyze/${game.id}`)
        }
    }, [navigate, loadPgnString])

    // Reset board
    const handleReset = useCallback(() => {
        skipSoundRef.current = true
        setMoveHistory([STARTING_FEN])
        setMoveSAN([])
        setMoveDetails([])
        setViewIndex(0)
        setWhitePlayerName('White')
        setBlackPlayerName('Black')
        setWhiteRating(undefined)
        setBlackRating(undefined)
        setAnalysisData(null)
        onResetEngine?.()
    }, [onResetEngine])

    const handleFlipBoard = useCallback(() => {
        setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))
    }, [])

    const goToStart = useCallback(() => setViewIndex(0), [])
    const goToPrev = useCallback(() => setViewIndex((prev) => Math.max(0, prev - 1)), [])
    const goToNext = useCallback(() => setViewIndex((prev) => Math.min(moveHistory.length - 1, prev + 1)), [moveHistory.length])
    const goToEnd = useCallback(() => setViewIndex(moveHistory.length - 1), [moveHistory.length])

    return {
        moveHistory,
        moveSAN,
        moveDetails,
        viewIndex,
        orientation,
        isLoadingGame,
        currentFen,
        displayChess,
        currentTurn,
        isCheck,
        isGameOver,
        winnerColor,
        currentLastMove,
        ranks,
        files,
        topBanner,
        bottomBanner,
        analysisData,
        moveListRef,
        setViewIndex,
        goToStart,
        goToPrev,
        goToNext,
        goToEnd,
        executeMove,
        loadPgnString,
        handleSelectPastGame,
        handleReset,
        handleFlipBoard,
    }
}
