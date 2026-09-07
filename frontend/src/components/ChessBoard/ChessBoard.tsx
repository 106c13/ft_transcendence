import { useState, useRef, useEffect } from 'react'
import type { Chess, Square, PieceSymbol } from 'chess.js'
import { getPieceImageSrc, PIECE_NAME } from '../../constants/gameConstants'
import PromotionOverlay from '../PromotionOverlay/PromotionOverlay'
import DisconnectWarning from '../DisconnectWarning/DisconnectWarning'
import styles from './ChessBoard.module.css'

type Props = {
    displayChess: Chess
    displayFen: string
    ranks: string[]
    files: string[]
    selectedSquare: string | null
    validMoves: string[]
    lastMove: { from: string; to: string } | null
    premoveSquares: Set<string>
    isReviewing: boolean
    isCheck: boolean
    turn: 'w' | 'b'
    playerColor: 'w' | 'b'
    showPromotion: boolean
    isPaused: boolean
    pauseCountdown: number | null
    onSquareClick: (sq: string) => void
    onSquareSelect?: (sq: string) => void
    onPieceDrop?: (fromSq: string, toSq: string) => void
    onDragStart?: (e: React.DragEvent, sq: string) => void
    onDragOver?: (e: React.DragEvent) => void
    onDrop?: (e: React.DragEvent, sq: string) => void
    onPromotionSelect: (pieceCode: string) => void
    isGameOver?: boolean
}

interface DragState {
    fromSquare: string
    pieceType: PieceSymbol
    pieceColor: 'w' | 'b'
    startX: number
    startY: number
    currentX: number
    currentY: number
    pieceWidth: number
    pieceHeight: number
    isDragging: boolean
    wasAlreadySelected: boolean
}

function ChessBoard({
    displayChess,
    displayFen,
    ranks,
    files,
    selectedSquare,
    validMoves,
    lastMove,
    premoveSquares,
    isReviewing,
    isCheck,
    turn,
    playerColor,
    showPromotion,
    isPaused,
    pauseCountdown,
    onSquareClick,
    onSquareSelect,
    onPieceDrop,
    onPromotionSelect,
    isGameOver = false,
}: Props) {
    const [dragState, setDragState] = useState<DragState | null>(null)
    const boardRef = useRef<HTMLDivElement>(null)
    const dragStateRef = useRef<DragState | null>(null)
    dragStateRef.current = dragState
    const justDraggedRef = useRef(false)

    const canInteract = !isReviewing && !isPaused && !isGameOver

    const handlePiecePointerDown = (
        e: React.PointerEvent<HTMLImageElement>,
        sq: string,
        piece: { type: PieceSymbol; color: 'w' | 'b' }
    ) => {
        if (e.button !== 0) return
        if (!canInteract) return
        if (piece.color !== playerColor) return

        e.preventDefault()

        const wasAlreadySelected = selectedSquare === sq
        onSquareSelect?.(sq)

        const imgRect = e.currentTarget.getBoundingClientRect()
        const width = imgRect.width || 48
        const height = imgRect.height || 48

        const initialDrag: DragState = {
            fromSquare: sq,
            pieceType: piece.type,
            pieceColor: piece.color,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            pieceWidth: width,
            pieceHeight: height,
            isDragging: false,
            wasAlreadySelected,
        }

        setDragState(initialDrag)
        dragStateRef.current = initialDrag
    }

    useEffect(() => {
        if (!dragState) return

        const handlePointerMove = (e: PointerEvent) => {
            const current = dragStateRef.current
            if (!current) return

            const dist = Math.hypot(e.clientX - current.startX, e.clientY - current.startY)
            const isDragging = current.isDragging || dist > 4

            const updated: DragState = {
                ...current,
                currentX: e.clientX,
                currentY: e.clientY,
                isDragging,
            }
            setDragState(updated)
            dragStateRef.current = updated
        }

        const handlePointerUp = (e: PointerEvent) => {
            const current = dragStateRef.current
            if (!current) return

            justDraggedRef.current = true
            setTimeout(() => {
                justDraggedRef.current = false
            }, 80)

            if (current.isDragging) {
                let targetSq = ''
                if (boardRef.current) {
                    const rect = boardRef.current.getBoundingClientRect()
                    if (
                        e.clientX >= rect.left &&
                        e.clientX <= rect.right &&
                        e.clientY >= rect.top &&
                        e.clientY <= rect.bottom
                    ) {
                        const col = Math.floor(((e.clientX - rect.left) / rect.width) * 8)
                        const row = Math.floor(((e.clientY - rect.top) / rect.height) * 8)
                        if (col >= 0 && col < 8 && row >= 0 && row < 8) {
                            targetSq = `${files[col]}${ranks[row]}`
                        }
                    }
                }

                if (onPieceDrop) {
                    onPieceDrop(current.fromSquare, targetSq)
                }
            } else {
                if (current.wasAlreadySelected) {
                    onSquareClick(current.fromSquare)
                } else if (onSquareSelect) {
                    onSquareSelect(current.fromSquare)
                }
            }

            setDragState(null)
            dragStateRef.current = null
        }

        const handlePointerCancel = () => {
            setDragState(null)
            dragStateRef.current = null
        }

        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
        window.addEventListener('pointercancel', handlePointerCancel)

        return () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
            window.removeEventListener('pointercancel', handlePointerCancel)
        }
    }, [dragState !== null, files, ranks, onPieceDrop, onSquareClick, onSquareSelect])

    useEffect(() => {
        if (dragState?.isDragging) {
            const prevCursor = document.body.style.cursor
            const prevUserSelect = document.body.style.userSelect
            document.body.style.cursor = 'grabbing'
            document.body.style.userSelect = 'none'

            return () => {
                document.body.style.cursor = prevCursor
                document.body.style.userSelect = prevUserSelect
            }
        }
    }, [dragState?.isDragging])

    const handleSquareClick = (sq: string) => {
        if (justDraggedRef.current) return
        onSquareClick(sq)
    }

    return (
        <div
            ref={boardRef}
            className={`${styles.chessBoard}${isReviewing ? ` ${styles.reviewing}` : ''}${
                dragState?.isDragging ? ` ${styles.isDragging}` : ''
            }`}
            data-fen={displayFen}
            onContextMenu={() => {
                if (dragState) {
                    setDragState(null)
                    dragStateRef.current = null
                }
            }}
        >
            {ranks.map((rank, rankIdx) =>
                files.map((file, fileIdx) => {
                    const sq = `${file}${rank}`
                    const piece = displayChess.get(sq as Square)
                    const isLight = (fileIdx + rankIdx) % 2 === 0
                    const isSel = selectedSquare === sq
                    const isValid = validMoves.includes(sq)
                    const isLastSrc = lastMove?.from === sq
                    const isLastDst = lastMove?.to === sq
                    const isPremoveSq = !isReviewing && premoveSquares.has(sq)
                    const isKingInCheck = isCheck && piece?.type === 'k' && piece?.color === turn

                    const isPieceDraggedFromHere = dragState?.isDragging && dragState.fromSquare === sq
                    const isOwnPiece = piece?.color === playerColor

                    return (
                        <div
                            key={sq}
                            onClick={() => handleSquareClick(sq)}
                            className={`${styles.square} ${isLight ? styles.light : styles.dark} ${
                                isSel ? styles.selected : ''
                            } ${isPremoveSq ? styles.premove : ''} ${
                                isLastSrc ? styles.lastMoveSrc : ''
                            } ${isLastDst ? styles.lastMoveDst : ''}`}
                        >
                            {piece && !isPieceDraggedFromHere && (
                                <img
                                    src={getPieceImageSrc(piece.type, piece.color)}
                                    alt={`${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAME[piece.type]}`}
                                    className={`${styles.piece} ${
                                        piece.color === 'w' ? styles.white : styles.black
                                    } ${isOwnPiece && canInteract ? styles.draggablePiece : ''} ${
                                        isKingInCheck ? styles.checkedKing : ''
                                    }`}
                                    draggable={false}
                                    onPointerDown={e => handlePiecePointerDown(e, sq, piece)}
                                />
                            )}

                            {isValid && !piece && <div className={styles.validMoveDot} />}
                            {isValid && piece && <div className={styles.validMoveCapture} />}
                        </div>
                    )
                })
            )}

            {dragState && dragState.isDragging && (
                <div
                    className={styles.floatingPiece}
                    style={{
                        left: `${dragState.currentX}px`,
                        top: `${dragState.currentY}px`,
                        width: `${dragState.pieceWidth}px`,
                        height: `${dragState.pieceHeight}px`,
                    }}
                >
                    <img
                        src={getPieceImageSrc(dragState.pieceType, dragState.pieceColor)}
                        alt=""
                        className={`${styles.piece} ${
                            dragState.pieceColor === 'w' ? styles.white : styles.black
                        } ${styles.floatingPieceImg} ${
                            isCheck && dragState.pieceType === 'k' && dragState.pieceColor === turn
                                ? styles.checkedKing
                                : ''
                        }`}
                        draggable={false}
                    />
                </div>
            )}

            {showPromotion && (
                <PromotionOverlay
                    playerColor={playerColor}
                    onSelect={onPromotionSelect}
                />
            )}

            {isPaused && <DisconnectWarning pauseCountdown={pauseCountdown} />}
        </div>
    )
}

export default ChessBoard