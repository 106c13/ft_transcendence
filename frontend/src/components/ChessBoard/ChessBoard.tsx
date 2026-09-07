import { useState, useRef, useEffect } from 'react'
import type { Chess, Square, PieceSymbol } from 'chess.js'
import { getPieceImageSrc, PIECE_NAME } from '../../constants/gameConstants'
import PromotionOverlay from '../PromotionOverlay/PromotionOverlay'
import DisconnectWarning from '../DisconnectWarning/DisconnectWarning'
import styles from './ChessBoard.module.css'

export type BoardArrow = {
    from: string
    to: string
    color?: string
}

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
    customArrows?: BoardArrow[]
    customHighlights?: Record<string, string> | Set<string>
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

interface RightDragState {
    startSq: string
    currentSq: string
    startX: number
    startY: number
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
    customArrows,
    customHighlights,
}: Props) {
    const [dragState, setDragState] = useState<DragState | null>(null)
    const boardRef = useRef<HTMLDivElement>(null)
    const dragStateRef = useRef<DragState | null>(null)
    dragStateRef.current = dragState
    const justDraggedRef = useRef(false)

    // Right-click annotation state (highlights & arrows)
    const [userHighlights, setUserHighlights] = useState<Set<string>>(new Set())
    const [userArrows, setUserArrows] = useState<BoardArrow[]>([])
    const [rightDrag, setRightDrag] = useState<RightDragState | null>(null)
    const rightDragRef = useRef<RightDragState | null>(null)
    rightDragRef.current = rightDrag

    const canInteract = !isReviewing && !isPaused && !isGameOver

    // Clear user annotations whenever board position changes (new move played)
    useEffect(() => {
        setUserHighlights(new Set())
        setUserArrows([])
    }, [displayFen])

    const getSquareFromCoords = (clientX: number, clientY: number): string | null => {
        if (!boardRef.current) return null
        const rect = boardRef.current.getBoundingClientRect()
        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
        ) {
            return null
        }
        const col = Math.floor(((clientX - rect.left) / rect.width) * 8)
        const row = Math.floor(((clientY - rect.top) / rect.height) * 8)
        if (col >= 0 && col < 8 && row >= 0 && row < 8) {
            return `${files[col]}${ranks[row]}`
        }
        return null
    }

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

    const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button === 0) {
            // Left click anywhere on board clears all user highlights and arrows (Chess.com behavior)
            if (userHighlights.size > 0 || userArrows.length > 0) {
                setUserHighlights(new Set())
                setUserArrows([])
            }
        } else if (e.button === 2) {
            // Right click down starts annotation highlight or arrow drag
            e.preventDefault()
            const sq = getSquareFromCoords(e.clientX, e.clientY)
            if (sq) {
                const initialRight: RightDragState = {
                    startSq: sq,
                    currentSq: sq,
                    startX: e.clientX,
                    startY: e.clientY,
                }
                setRightDrag(initialRight)
                rightDragRef.current = initialRight
            }
        }
    }

    // Piece dragging listeners
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
                const targetSq = getSquareFromCoords(e.clientX, e.clientY) || ''
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

    // Cursor handling during left-piece drag
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

    // Right-click annotation listeners (drawing arrow / toggling highlight)
    useEffect(() => {
        if (!rightDrag) return

        const handleRightPointerMove = (e: PointerEvent) => {
            const current = rightDragRef.current
            if (!current) return

            const sq = getSquareFromCoords(e.clientX, e.clientY)
            if (sq && sq !== current.currentSq) {
                const updated = { ...current, currentSq: sq }
                rightDragRef.current = updated
                setRightDrag(updated)
            }
        }

        const handleRightPointerUp = (e: PointerEvent) => {
            if (e.button === 2) {
                const current = rightDragRef.current
                if (current) {
                    const dist = Math.hypot(e.clientX - current.startX, e.clientY - current.startY)
                    if (dist < 8 || current.startSq === current.currentSq) {
                        // Right-clicked a single square: toggle red highlight
                        setUserHighlights(prev => {
                            const next = new Set(prev)
                            if (next.has(current.startSq)) {
                                next.delete(current.startSq)
                            } else {
                                next.add(current.startSq)
                            }
                            return next
                        })
                    } else {
                        // Right-dragged between two squares: toggle arrow
                        setUserArrows(prev => {
                            const exists = prev.findIndex(
                                a => a.from === current.startSq && a.to === current.currentSq
                            )
                            if (exists >= 0) {
                                return prev.filter((_, i) => i !== exists)
                            } else {
                                return [...prev, { from: current.startSq, to: current.currentSq }]
                            }
                        })
                    }
                    setRightDrag(null)
                    rightDragRef.current = null
                }
            }
        }

        window.addEventListener('pointermove', handleRightPointerMove)
        window.addEventListener('pointerup', handleRightPointerUp)

        return () => {
            window.removeEventListener('pointermove', handleRightPointerMove)
            window.removeEventListener('pointerup', handleRightPointerUp)
        }
    }, [rightDrag !== null, files, ranks])

    const handleSquareClick = (sq: string) => {
        if (justDraggedRef.current) return
        onSquareClick(sq)
    }

    const getSquareCenter = (sq: string) => {
        const file = sq[0]
        const rank = sq[1]
        const col = files.indexOf(file)
        const row = ranks.indexOf(rank)
        if (col === -1 || row === -1) return null
        return {
            x: col * 100 + 50,
            y: row * 100 + 50,
            col,
            row,
        }
    }

    const renderArrow = (from: string, to: string, color = '#f59e0b', key: string, isPreview = false) => {
        const start = getSquareCenter(from)
        const end = getSquareCenter(to)
        if (!start || !end || from === to) return null

        const dx = end.col - start.col
        const dy = end.row - start.row
        const isKnight =
            (Math.abs(dx) === 1 && Math.abs(dy) === 2) ||
            (Math.abs(dx) === 2 && Math.abs(dy) === 1)

        const shaftWidth = 19
        const headLength = 36
        const headWidth = 28
        const tipOffset = 15

        let shaftElement: React.ReactNode = null
        let tipX = 0
        let tipY = 0
        let wing1X = 0
        let wing1Y = 0
        let wing2X = 0
        let wing2Y = 0

        if (isKnight) {
            if (Math.abs(dy) === 2) {
                const cornerX = start.x
                const cornerY = end.y
                const ux = Math.sign(dx)
                const nx = 0
                const ny = 1

                tipX = end.x - ux * tipOffset
                tipY = end.y
                const baseX = tipX - ux * headLength
                const baseY = end.y

                wing1X = baseX + nx * headWidth
                wing1Y = baseY + ny * headWidth
                wing2X = baseX - nx * headWidth
                wing2Y = baseY - ny * headWidth

                const shaftEndX = baseX + ux * 4
                const shaftEndY = baseY

                shaftElement = (
                    <path
                        d={`M ${start.x} ${start.y} L ${cornerX} ${cornerY} L ${shaftEndX} ${shaftEndY}`}
                        stroke={color}
                        strokeWidth={shaftWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                )
            } else {
                const cornerX = end.x
                const cornerY = start.y
                const uy = Math.sign(dy)
                const nx = -Math.sign(dy)
                const ny = 0

                tipX = end.x
                tipY = end.y - uy * tipOffset
                const baseX = end.x
                const baseY = tipY - uy * headLength

                wing1X = baseX + nx * headWidth
                wing1Y = baseY + ny * headWidth
                wing2X = baseX - nx * headWidth
                wing2Y = baseY - ny * headWidth

                const shaftEndX = baseX
                const shaftEndY = baseY + uy * 4

                shaftElement = (
                    <path
                        d={`M ${start.x} ${start.y} L ${cornerX} ${cornerY} L ${shaftEndX} ${shaftEndY}`}
                        stroke={color}
                        strokeWidth={shaftWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                )
            }
        } else {
            const deltaX = end.x - start.x
            const deltaY = end.y - start.y
            const len = Math.hypot(deltaX, deltaY)
            if (len < 1) return null

            const ux = deltaX / len
            const uy = deltaY / len
            const nx = -uy
            const ny = ux

            tipX = end.x - ux * tipOffset
            tipY = end.y - uy * tipOffset
            const baseX = tipX - ux * headLength
            const baseY = tipY - uy * headLength

            wing1X = baseX + nx * headWidth
            wing1Y = baseY + ny * headWidth
            wing2X = baseX - nx * headWidth
            wing2Y = baseY - ny * headWidth

            const shaftEndX = baseX + ux * 4
            const shaftEndY = baseY + uy * 4

            shaftElement = (
                <line
                    x1={start.x}
                    y1={start.y}
                    x2={shaftEndX}
                    y2={shaftEndY}
                    stroke={color}
                    strokeWidth={shaftWidth}
                    strokeLinecap="round"
                />
            )
        }

        return (
            <g key={key} opacity={isPreview ? 0.6 : 0.88}>
                {shaftElement}
                <polygon
                    points={`${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`}
                    fill={color}
                    stroke={color}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
            </g>
        )
    }

    return (
        <div
            ref={boardRef}
            className={`${styles.chessBoard}${isReviewing ? ` ${styles.reviewing}` : ''}${
                dragState?.isDragging ? ` ${styles.isDragging}` : ''
            }`}
            data-fen={displayFen}
            onPointerDown={handleBoardPointerDown}
            onContextMenu={e => {
                e.preventDefault()
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

                    const isRedHighlighted =
                        userHighlights.has(sq) ||
                        (customHighlights instanceof Set
                            ? customHighlights.has(sq)
                            : Boolean(customHighlights?.[sq]))

                    return (
                        <div
                            key={sq}
                            onClick={() => handleSquareClick(sq)}
                            className={`${styles.square} ${isLight ? styles.light : styles.dark} ${
                                isSel ? styles.selected : ''
                            } ${isPremoveSq ? styles.premove : ''} ${
                                isLastSrc ? styles.lastMoveSrc : ''
                            } ${isLastDst ? styles.lastMoveDst : ''} ${
                                isRedHighlighted ? styles.highlightedRed : ''
                            }`}
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

            {/* SVG Vector Annotations Overlay (Arrows) */}
            <svg
                className={styles.annotationsOverlay}
                viewBox="0 0 800 800"
                preserveAspectRatio="none"
            >
                {/* User Drawn Arrows */}
                {userArrows.map((arrow, idx) =>
                    renderArrow(
                        arrow.from,
                        arrow.to,
                        arrow.color || '#f59e0b',
                        `user-arrow-${idx}`
                    )
                )}

                {/* External Custom Arrows (Analysis) */}
                {customArrows?.map((arrow, idx) =>
                    renderArrow(
                        arrow.from,
                        arrow.to,
                        arrow.color || '#10b981',
                        `custom-arrow-${idx}`
                    )
                )}

                {/* Live Arrow Preview while Right-Dragging */}
                {rightDrag && rightDrag.startSq !== rightDrag.currentSq &&
                    renderArrow(
                        rightDrag.startSq,
                        rightDrag.currentSq,
                        '#f59e0b',
                        'preview-arrow',
                        true
                    )
                }
            </svg>

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