import { useTranslation } from 'react-i18next'
import { useGameSocket } from '../../hooks/useGameSocket'
import { useChessBoard } from '../../hooks/useChessBoard'
import { getPieceImageSrc } from '../../constants/gameConstants'

import PlayerBanner from '../../components/PlayerBanner/Playerbanner'
import ChessBoard from '../../components/ChessBoard/ChessBoard'
import ChessInfoPanel from '../../components/ChessInfoPanel/ChessInfoPanel'
import GameOverDialog from '../../components/GameOverDialog/GameOverDialog'
import styles from './GamePage.module.css'

export default function Game() {
    const { t } = useTranslation()

    const game = useGameSocket()
    const board = useChessBoard({
        gameState: game.gameState,
        isGameOver: game.isGameOver,
        isPaused: game.isPaused,
        isReviewing: game.isReviewing,
        boardFen: game.boardFen,
        playerColor: game.playerColor,
        turn: game.turn,
        premoves: game.premoves,
        setPremoves: game.setPremoves,
        sendMove: game.sendMove,
    })

    return (
        <div className={styles.gameContainer}>
            <main className={styles.gameMain}>
                {game.gameState === 'searching' && (
                    <div className={styles.searchingCard}>
                        <div className={styles.searchingPulse}>
                            <img
                                src={getPieceImageSrc('p', 'w')}
                                alt=""
                                className={styles.searchingPulseIcon}
                            />
                        </div>
                        <h3>{t('searching_match', 'Searching for opponent...')}</h3>
                        <p>{t('searching_desc', 'Filtering by match speed: ')} <strong>{game.selectedMode}</strong></p>
                        <button className={styles.cancelMatchBtn} onClick={game.cancelMatchmaking}>
                            {t('cancel', 'Cancel')}
                        </button>
                    </div>
                )}

                {game.gameState === 'playing' && (
                    <div className={styles.gamePlayArea}>
                        <div
                            className={styles.boardContainer}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                game.setPremoves([])
                            }}
                        >
                            <PlayerBanner
                                name={game.opponentName}
                                color={game.playerColor === 'w' ? 'b' : 'w'}
                                time={game.playerColor === 'w' ? game.blackTime : game.whiteTime}
                                isActive={game.turn !== game.playerColor}
                            />

                            <ChessBoard
                                displayChess={game.displayChess}
                                displayFen={game.displayFen}
                                ranks={game.ranks}
                                files={game.files}
                                selectedSquare={board.selectedSquare}
                                validMoves={board.validMoves}
                                lastMove={game.lastMove}
                                premoveSquares={game.premoveSquares}
                                isReviewing={game.isReviewing}
                                isCheck={game.isCheck}
                                turn={game.turn}
                                playerColor={game.playerColor}
                                showPromotion={board.showPromotion}
                                isPaused={game.isPaused}
                                pauseCountdown={game.pauseCountdown}
                                onSquareClick={board.handleSquareClick}
                                onDragStart={board.handleDragStart}
                                onDragOver={board.handleDragOver}
                                onDrop={board.handleDrop}
                                onPromotionSelect={board.handlePromotionSelect}
                            />

                            <PlayerBanner
                                name={game.currentUser?.username || 'You'}
                                color={game.playerColor === 'w' ? 'w' : 'b'}
                                time={game.playerColor === 'w' ? game.whiteTime : game.blackTime}
                                isActive={game.turn === game.playerColor}
                                isBottom={true}
                            />
                        </div>

                        <ChessInfoPanel
                            selectedMode={game.selectedMode}
                            captured={game.captured}
                            whiteScore={game.whiteScore}
                            blackScore={game.blackScore}
                            playerColor={game.playerColor}
                            moveHistory={game.moveHistory}
                            moveSAN={game.moveSAN}
                            viewIndex={game.viewIndex}
                            isReviewing={game.isReviewing}
                            isGameOver={game.isGameOver}
                            onSelectIndex={game.setViewIndex}
                            onResign={game.resignGame}
                        />
                    </div>
                )}

                {game.isGameOver && !game.hideGameOverModal && (
                    <GameOverDialog
                        winnerColor={game.winnerColor}
                        playerColor={game.playerColor}
                        gameOverReason={game.gameOverReason}
                        onClose={() => game.setHideGameOverModal(true)}
                        onPlayAgain={() => {
                            game.setIsGameOver(false)
                            game.startMatchmaking()
                        }}
                    />
                )}
            </main>
        </div>
    )
}
