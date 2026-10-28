import { useState, useCallback } from 'react'
import type { Chess, Square } from 'chess.js'

interface UseAnalyzeBoardParams {
    displayChess: Chess
    currentTurn: 'w' | 'b'
    onMove: (from: string, to: string, promotion?: string) => boolean
}

export function useAnalyzeBoard({
    displayChess,
    currentTurn,
    onMove,
}: UseAnalyzeBoardParams) {
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
    const [validMoves, setValidMoves] = useState<string[]>([])
    const [showPromotion, setShowPromotion] = useState<boolean>(false)
    const [promotionSquare, setPromotionSquare] = useState<string | null>(null)
    const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null)

    const resetSelection = useCallback(() => {
        setSelectedSquare(null)
        setValidMoves([])
        setShowPromotion(false)
        setPromotionSquare(null)
        setPendingMove(null)
    }, [])

    const handleSquareClick = useCallback(
        (sq: string) => {
            if (!selectedSquare) {
                const piece = displayChess.get(sq as Square)
                if (piece && piece.color === currentTurn) {
                    setSelectedSquare(sq)
                    const moves = displayChess.moves({ square: sq as Square, verbose: true })
                    setValidMoves(moves.map((m) => m.to))
                }
                return
            }

            if (selectedSquare === sq) {
                setSelectedSquare(null)
                setValidMoves([])
                return
            }

            const clickedPiece = displayChess.get(sq as Square)
            if (clickedPiece && clickedPiece.color === currentTurn) {
                setSelectedSquare(sq)
                const moves = displayChess.moves({ square: sq as Square, verbose: true })
                setValidMoves(moves.map((m) => m.to))
                return
            }

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

                onMove(selectedSquare, sq)
                setSelectedSquare(null)
                setValidMoves([])
            } else {
                setSelectedSquare(null)
                setValidMoves([])
            }
        },
        [selectedSquare, displayChess, currentTurn, validMoves, onMove]
    )

    const handleSquareSelect = useCallback(
        (sq: string) => {
            const piece = displayChess.get(sq as Square)
            if (piece && piece.color === currentTurn) {
                setSelectedSquare(sq)
                const moves = displayChess.moves({ square: sq as Square, verbose: true })
                setValidMoves(moves.map((m) => m.to))
            } else {
                setSelectedSquare(null)
                setValidMoves([])
            }
        },
        [displayChess, currentTurn]
    )

    const handlePieceDrop = useCallback(
        (fromSq: string, toSq: string) => {
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

            onMove(fromSq, toSq)
            setSelectedSquare(null)
            setValidMoves([])
        },
        [displayChess, currentTurn, onMove]
    )

    const handlePromotionSelect = useCallback(
        (pieceCode: string) => {
            if (pendingMove) {
                onMove(pendingMove.from, pendingMove.to, pieceCode.toLowerCase())
            }
            setShowPromotion(false)
            setPromotionSquare(null)
            setPendingMove(null)
            setSelectedSquare(null)
            setValidMoves([])
        },
        [pendingMove, onMove]
    )

    const handlePromotionCancel = useCallback(() => {
        setShowPromotion(false)
        setPromotionSquare(null)
        setPendingMove(null)
    }, [])

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            if (showPromotion) {
                handlePromotionCancel()
            }
        },
        [showPromotion, handlePromotionCancel]
    )

    return {
        selectedSquare,
        validMoves,
        showPromotion,
        promotionSquare,
        handleSquareClick,
        handleSquareSelect,
        handlePieceDrop,
        handlePromotionSelect,
        handlePromotionCancel,
        handleContextMenu,
        resetSelection,
    }
}

