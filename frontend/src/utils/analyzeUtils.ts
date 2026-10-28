import { Chess } from 'chess.js'
import type { SoundType } from './sound'

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface EvaluationLine {
    score: number
    mate: number | null
    bestMove: string
    bestMoveSan?: string
    pv?: string[]
    pvSan?: string[]
    depth?: number
    multipv?: number
}

export interface EvaluationResult {
    score: number
    mate: number | null
    bestMove?: string
    bestMoveSan?: string
    pv?: string[]
    pvSan?: string[]
    depth?: number
    lines?: EvaluationLine[]
}

export interface EvalInfo {
    winChanceWhite: number
    winChanceBlack: number
    scoreText: string
    isWhiteAdvantage: boolean
    mate: number | null
    score: number
}

export function getSoundForSan(san?: string): SoundType {
    if (!san) return 'move-self'
    if (san.includes('+') || san.includes('#')) return 'move-check'
    if (san.includes('O-O')) return 'castle'
    if (san.includes('=')) return 'promote'
    if (san.includes('x')) return 'capture'
    return 'move-self'
}

export function formatLineScore(score: number, mate: number | null): string {
    if (mate !== null && mate !== undefined) {
        return `M${Math.abs(mate)}`
    }
    const pawns = score / 100
    return pawns > 0 ? `+${pawns.toFixed(1)}` : `${pawns.toFixed(1)}`
}

export interface CapturedPiecesAndDiff {
    capturedWhite: { type: string; color: 'w' }[]
    capturedBlack: { type: string; color: 'b' }[]
    whiteDiff: number
    blackDiff: number
}

export function getCapturedPiecesAndDiff(fen: string): CapturedPiecesAndDiff {
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

