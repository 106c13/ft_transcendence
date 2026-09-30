import { useTranslation } from 'react-i18next'
import { useGameSocket } from '../../hooks/useGameSocket'
import { useChessBoard } from '../../hooks/useChessBoard'
import { usePageTitle } from '../../hooks/usePageTitle'

import PlayerBanner from '../../components/PlayerBanner/Playerbanner'
import ChessBoard from '../../components/ChessBoard/ChessBoard'
import ChessInfoPanel from '../../components/ChessInfoPanel/ChessInfoPanel'
import GameOverDialog from '../../components/GameOverDialog/GameOverDialog'
import styles from './GamePage.module.css'

export default function GamePage() {
    const { t } = useTranslation()
    usePageTitle('page_title_game', 'Chess Arena')

    const game = useGameSocket()
    const board = useChessBoard({
        gameState: game.gameState,
        isGameOver: game.isGameOver,
        isPaused: game.isPaused,
        isReviewing: game.isReviewing,
        isViewer: game.isViewer,
        boardFen: game.boardFen,
        playerColor: game.playerColor,
        turn: game.turn,
        premoves: game.premoves,
        setPremoves: game.setPremoves,
        sendMove: game.sendMove,
        onIllegalMove: game.handleIllegalMove,
    })

    // Player mode calculations
    const opponentColor = game.playerColor === 'w' ? 'b' : 'w'
    const opponentCaptured = opponentColor === 'w' ? game.captured.b : game.captured.w
    const opponentDiff = opponentColor === 'w'
        ? (game.whiteScore > game.blackScore ? game.whiteScore - game.blackScore : 0)
        : (game.blackScore > game.whiteScore ? game.blackScore - game.whiteScore : 0)

    const playerCaptured = game.playerColor === 'w' ? game.captured.b : game.captured.w
    const playerDiff = game.playerColor === 'w'
        ? (game.whiteScore > game.blackScore ? game.whiteScore - game.blackScore : 0)
        : (game.blackScore > game.whiteScore ? game.blackScore - game.whiteScore : 0)

    // Viewer mode banner data
    const topViewerPlayer = {
        name: game.blackPlayer?.username || (game.playerColor === 'w' ? game.opponentName : game.currentUser?.username) || 'Black',
        username: game.blackPlayer?.username || (game.playerColor === 'w' ? game.opponentName : game.currentUser?.username),
        avatar: game.blackPlayer?.avatar ?? (game.playerColor === 'w' ? game.opponentAvatar : game.currentUser?.avatar),
        time: game.blackTime,
        color: 'b' as const,
        isActive: game.turn === 'b' && !game.isGameOver && game.gameState === 'playing',
        rating: game.blackPlayer?.rating ?? (game.playerColor === 'w' ? game.opponentRating : game.playerRating),
        isProvisional: game.blackPlayer?.isProvisional ?? (game.playerColor === 'w' ? game.opponentIsProvisional : game.playerIsProvisional),
        captured: game.captured.w,
        diff: game.blackScore > game.whiteScore ? game.blackScore - game.whiteScore : 0,
    }

    const bottomViewerPlayer = {
        name: game.whitePlayer?.username || (game.playerColor === 'w' ? game.currentUser?.username : game.opponentName) || 'White',
        username: game.whitePlayer?.username || (game.playerColor === 'w' ? game.currentUser?.username : game.opponentName),
        avatar: game.whitePlayer?.avatar ?? (game.playerColor === 'w' ? game.currentUser?.avatar : game.opponentAvatar),
        time: game.whiteTime,
        color: 'w' as const,
        isActive: game.turn === 'w' && !game.isGameOver && game.gameState === 'playing',
        rating: game.whitePlayer?.rating ?? (game.playerColor === 'w' ? game.playerRating : game.opponentRating),
        isProvisional: game.whitePlayer?.isProvisional ?? (game.playerColor === 'w' ? game.playerIsProvisional : game.opponentIsProvisional),
        captured: game.captured.b,
        diff: game.whiteScore > game.blackScore ? game.whiteScore - game.blackScore : 0,
    }

    return (
        <div className={styles.gameContainer}>
            <main className={styles.gameMain}>
                <div className={styles.gamePlayArea}>
                    <div
                        className={styles.boardContainer}
                        onContextMenu={(e) => {
                            e.preventDefault()
                            if (board.showPromotion) {
                                board.handlePromotionCancel()
                                return
                            }
                            if (!game.isViewer) {
                                game.setPremoves([])
                            }
                        }}
                    >
                        {/* Top Banner: Black in viewer mode, or Opponent in player mode */}
                        {game.isViewer ? (
                            <PlayerBanner
                                name={topViewerPlayer.name}
                                username={topViewerPlayer.username}
                                avatar={topViewerPlayer.avatar}
                                color={topViewerPlayer.color}
                                time={topViewerPlayer.time}
                                isActive={topViewerPlayer.isActive}
                                rating={topViewerPlayer.rating}
                                isProvisional={topViewerPlayer.isProvisional}
                                selectedMode={game.selectedMode}
                                capturedPieces={topViewerPlayer.captured}
                                materialDiff={topViewerPlayer.diff}
                            />
                        ) : (
                            <PlayerBanner
                                name={game.opponentName || t('opponent', 'Opponent')}
                                username={game.opponentName}
                                avatar={game.opponentAvatar}
                                color={opponentColor}
                                time={game.playerColor === 'w' ? game.blackTime : game.whiteTime}
                                isActive={game.turn !== game.playerColor && !game.isGameOver && game.gameState === 'playing'}
                                rating={game.opponentRating}
                                isProvisional={game.opponentIsProvisional}
                                selectedMode={game.selectedMode}
                                capturedPieces={opponentCaptured}
                                materialDiff={opponentDiff}
                            />
                        )}

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
                            promotionSquare={board.promotionSquare}
                            isPaused={game.isPaused}
                            pauseCountdown={game.pauseCountdown}
                            onSquareClick={board.handleSquareClick}
                            onSquareSelect={board.handleSquareSelect}
                            onPieceDrop={board.handlePieceDrop}
                            onPromotionSelect={board.handlePromotionSelect}
                            onPromotionCancel={board.handlePromotionCancel}
                            isGameOver={game.isGameOver}
                            isViewer={game.isViewer}
                        />

                        {/* Bottom Banner: White in viewer mode, or Current User in player mode */}
                        {game.isViewer ? (
                            <PlayerBanner
                                name={bottomViewerPlayer.name}
                                username={bottomViewerPlayer.username}
                                avatar={bottomViewerPlayer.avatar}
                                color={bottomViewerPlayer.color}
                                time={bottomViewerPlayer.time}
                                isActive={bottomViewerPlayer.isActive}
                                isBottom={true}
                                rating={bottomViewerPlayer.rating}
                                isProvisional={bottomViewerPlayer.isProvisional}
                                selectedMode={game.selectedMode}
                                capturedPieces={bottomViewerPlayer.captured}
                                materialDiff={bottomViewerPlayer.diff}
                            />
                        ) : (
                            <PlayerBanner
                                name={game.currentUser?.username || t('you')}
                                username={game.currentUser?.username}
                                avatar={game.currentUser?.avatar}
                                color={game.playerColor === 'w' ? 'w' : 'b'}
                                time={game.playerColor === 'w' ? game.whiteTime : game.blackTime}
                                isActive={game.turn === game.playerColor && !game.isGameOver && game.gameState === 'playing'}
                                isBottom={true}
                                rating={game.playerRating}
                                isProvisional={game.playerIsProvisional}
                                initialRatings={game.currentUser?.ratings}
                                selectedMode={game.selectedMode}
                                capturedPieces={playerCaptured}
                                materialDiff={playerDiff}
                            />
                        )}
                    </div>

                    <ChessInfoPanel
                        selectedMode={game.selectedMode}
                        captured={game.captured}
                        whiteScore={game.whiteScore}
                        blackScore={game.blackScore}
                        playerColor={game.playerColor}
                        moveHistory={game.moveHistory}
                        moveSAN={game.moveSAN}
                        moveTimes={game.moveTimes}
                        viewIndex={game.viewIndex}
                        isReviewing={game.isReviewing}
                        isGameOver={game.isGameOver}
                        isViewer={game.isViewer}
                        onSelectIndex={game.setViewIndex}
                        onResign={game.resignGame}
                        drawOfferState={game.drawOfferState}
                        onOfferDraw={game.offerDraw}
                        onAcceptDraw={game.acceptDraw}
                        onDeclineDraw={game.declineDraw}
                        onAnalyze={game.analyzeGame}
                    />
                </div>

                {game.isGameOver && !game.hideGameOverModal && !game.isViewer && (
                    <GameOverDialog
                        winnerColor={game.winnerColor}
                        playerColor={game.playerColor}
                        gameOverReason={game.gameOverReason}
                        ratingAfter={game.playerRatingAfter}
                        ratingDelta={game.playerRatingDelta}
                        onClose={() => game.setHideGameOverModal(true)}
                        onPlayAgain={() => {
                            game.setIsGameOver(false)
                            game.startMatchmaking()
                        }}
                        rematchState={game.rematchState}
                        onRematch={game.sendRematch}
                        onAcceptRematch={game.acceptRematch}
                        onDeclineRematch={game.declineRematch}
                        onAnalyze={game.analyzeGame}
                    />
                )}
            </main>
        </div>
    )
}
