import { useState } from 'react'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { getSimulatedChess, type Premove } from './useGameSocket'

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

interface UseChessBoardParams {
    gameState: 'searching' | 'playing'
    isGameOver: boolean
    isPaused: boolean
    isReviewing: boolean
    boardFen: string
    playerColor: 'w' | 'b'
    turn: 'w' | 'b'
    premoves: Premove[]
    setPremoves: React.Dispatch<React.SetStateAction<Premove[]>>
    sendMove: (from: string, to: string, promotion?: string) => void
}

export function useChessBoard({
    gameState,
    isGameOver,
    isPaused,
    isReviewing,
    boardFen,
    playerColor,
    turn,
    premoves,
    setPremoves,
    sendMove,
}: UseChessBoardParams) {
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
    const [validMoves, setValidMoves] = useState<string[]>([])

    // Promotion Modal states
    const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null)
    const [showPromotion, setShowPromotion] = useState(false)

    // Premove promotion
    const [pendingPremove, setPendingPremove] = useState<Premove | null>(null)

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
                        setSelectedSquare(null)
                        setValidMoves([])
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
                    setSelectedSquare(null)
                    setValidMoves([])
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
            setSelectedSquare(null)
            setValidMoves([])
        }
    }

    return {
        selectedSquare,
        validMoves,
        showPromotion,
        handleSquareClick,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handlePromotionSelect,
    }
}
