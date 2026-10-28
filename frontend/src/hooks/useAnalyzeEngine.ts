import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { BoardArrow } from '../components/ChessBoard/ChessBoard'
import type { GameAnalysisResult } from '../utils/gameUtils'
import type {
    EvaluationLine,
    EvaluationResult,
    EvalInfo,
} from '../utils/analyzeUtils'

interface UseAnalyzeEngineParams {
    currentFen: string
    displayChess: Chess
    viewIndex: number
    moveHistory: string[]
    moveDetails: { from: string; to: string }[]
    analysisData: GameAnalysisResult | null
}

const INITIAL_EVAL_INFO: EvalInfo = {
    winChanceWhite: 50,
    winChanceBlack: 50,
    scoreText: '0.0',
    isWhiteAdvantage: true,
    mate: null,
    score: 0,
}

export function useAnalyzeEngine({
    currentFen,
    displayChess,
    viewIndex,
    moveHistory,
    moveDetails,
    analysisData,
}: UseAnalyzeEngineParams) {
    const [isEvaluating, setIsEvaluating] = useState<boolean>(false)
    const [evalInfo, setEvalInfo] = useState<EvalInfo>(INITIAL_EVAL_INFO)
    const [engineLines, setEngineLines] = useState<EvaluationLine[]>([])
    const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0)
    const [customArrows, setCustomArrows] = useState<BoardArrow[]>([])

    const evalCacheRef = useRef<Map<string, EvaluationResult>>(new Map())

    // Clear best-move suggestion arrow when navigating moves
    useEffect(() => {
        setCustomArrows([])
    }, [viewIndex])

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

    const handleSelectEngineLine = useCallback((index: number) => {
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
    }, [engineLines])

    // Live position evaluation effect with debounce & memory cache
    useEffect(() => {
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

        const cached = evalCacheRef.current.get(currentFen)
        if (cached) {
            applyEvaluation(cached, currentFen)
            return
        }

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

    // Dynamic Move Classification (best, great, blunder, etc.)
    const currentMoveClassification = useMemo(() => {
        if (viewIndex === 0) return null
        const playedMove = moveDetails[viewIndex - 1]
        if (!playedMove || !playedMove.to) return null

        const targetSquare = playedMove.to
        const fenBefore = moveHistory[viewIndex - 1]
        const fenAfter = moveHistory[viewIndex]
        const analysis = analysisData?.positions[viewIndex - 1]

        // 1. Recorded game classification at this ply
        if (
            analysis &&
            analysis.classification &&
            analysis.from === playedMove.from &&
            analysis.to === playedMove.to &&
            (!analysis.fenBefore || analysis.fenBefore === fenBefore)
        ) {
            return {
                square: targetSquare,
                classification: analysis.classification,
            }
        }

        // 2. Alternative move evaluation via cached engine telemetry
        const evalBefore = fenBefore ? evalCacheRef.current.get(fenBefore) : undefined
        const evalAfter = fenAfter ? evalCacheRef.current.get(fenAfter) : undefined

        const bestMoveUci =
            (analysis?.fenBefore === fenBefore && analysis?.bestMove
                ? `${analysis.bestMove.from}${analysis.bestMove.to}`
                : null) ||
            evalBefore?.bestMove ||
            evalBefore?.lines?.[0]?.bestMove

        const playedUci = `${playedMove.from}${playedMove.to}`

        if (bestMoveUci && playedUci === bestMoveUci) {
            return {
                square: targetSquare,
                classification: 'best',
            }
        }

        if (fenAfter) {
            try {
                const cAfter = new Chess(fenAfter)
                if (cAfter.isCheckmate()) {
                    return {
                        square: targetSquare,
                        classification: 'best',
                    }
                }
            } catch {}
        }

        const scoreBefore =
            (analysis?.fenBefore === fenBefore ? analysis?.score : undefined) ?? evalBefore?.score
        const scoreAfter = evalAfter?.score

        if (scoreBefore !== undefined && scoreAfter !== undefined && fenBefore) {
            try {
                const cBefore = new Chess(fenBefore)
                const playerColor = cBefore.turn()
                const bestEval = playerColor === 'w' ? scoreBefore : -scoreBefore
                const playedEval = playerColor === 'w' ? scoreAfter : -scoreAfter
                const mateBefore = evalBefore?.mate ?? null
                const mateAfter = evalAfter?.mate ?? null

                let centipawnLoss = 0
                if (mateBefore !== null && mateAfter !== null) {
                    const myBeforeMate = playerColor === 'w' ? mateBefore : -mateBefore
                    const myAfterMate = playerColor === 'w' ? mateAfter : -mateAfter
                    if (myBeforeMate > 0 && myAfterMate > 0) {
                        const delayed = myAfterMate - (myBeforeMate - 1)
                        centipawnLoss = Math.max(0, delayed * 40)
                    } else {
                        centipawnLoss = Math.max(0, bestEval - playedEval)
                    }
                } else if (mateBefore !== null && mateAfter === null) {
                    const myBeforeMate = playerColor === 'w' ? mateBefore : -mateBefore
                    if (myBeforeMate > 0) {
                        centipawnLoss = Math.max(250, bestEval - playedEval)
                    } else {
                        centipawnLoss = Math.max(0, bestEval - playedEval)
                    }
                } else {
                    centipawnLoss = Math.max(0, bestEval - playedEval)
                }

                let classification = 'good'
                if (centipawnLoss <= 8) classification = 'best'
                else if (centipawnLoss <= 25) classification = 'excellent'
                else if (centipawnLoss <= 60) classification = 'good'
                else if (centipawnLoss <= 150) classification = 'inaccuracy'
                else if (centipawnLoss <= 300) classification = 'mistake'
                else classification = 'blunder'

                return {
                    square: targetSquare,
                    classification,
                }
            } catch {}
        }

        return null
    }, [viewIndex, analysisData, moveDetails, moveHistory, evalInfo])

    const resetEngine = useCallback(() => {
        setCustomArrows([])
        setEngineLines([])
        setSelectedLineIndex(0)
        setEvalInfo(INITIAL_EVAL_INFO)
    }, [])

    return {
        isEvaluating,
        evalInfo,
        engineLines,
        selectedLineIndex,
        customArrows,
        currentMoveClassification,
        handleSelectEngineLine,
        setCustomArrows,
        resetEngine,
    }
}

