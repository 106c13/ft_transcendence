import type { Chess, Square } from 'chess.js'
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
    onDragStart: (e: React.DragEvent, sq: string) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent, sq: string) => void
    onPromotionSelect: (pieceCode: string) => void
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
    onDragStart,
    onDragOver,
    onDrop,
    onPromotionSelect,
}: Props) {
    return (
        <div className={`${styles.chessBoard}${isReviewing ? ` ${styles.reviewing}` : ''}`} data-fen={displayFen}>
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

                    return (
                        <div
                            key={sq}
                            onClick={() => onSquareClick(sq)}
                            onDragOver={onDragOver}
                            onDrop={e => onDrop(e, sq)}
                            className={`${styles.square} ${isLight ? styles.light : styles.dark} ${isSel ? styles.selected : ''} ${isPremoveSq ? styles.premove : ''} ${isLastSrc ? styles.lastMoveSrc : ''} ${isLastDst ? styles.lastMoveDst : ''} ${isKingInCheck ? styles.check : ''}`}
                        >
                            {piece && (
                                <img
                                    src={getPieceImageSrc(piece.type, piece.color)}
                                    alt={`${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAME[piece.type]}`}
                                    className={`${styles.piece} ${piece.color === 'w' ? styles.white : styles.black}`}
                                    draggable={true}
                                    onDragStart={e => onDragStart(e, sq)}
                                />
                            )}

                            {isValid && !piece && <div className={styles.validMoveDot} />}
                            {isValid && piece && <div className={styles.validMoveCapture} />}
                        </div>
                    )
                })
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