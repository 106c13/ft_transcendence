import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContextType } from '../../layouts/MainLayout'
import { useGameSocket } from '../../hooks/useGameSocket'
import { useChessBoard } from '../../hooks/useChessBoard'
import { usePageTitle } from '../../hooks/usePageTitle'

import PlayerBanner from '../../components/PlayerBanner/Playerbanner'
import ChessBoard from '../../components/ChessBoard/ChessBoard'
import ChessInfoPanel from '../../components/ChessInfoPanel/ChessInfoPanel'
import GameOverDialog from '../../components/GameOverDialog/GameOverDialog'
import ChessSkeleton from '../../components/ChessSkeleton/ChessSkeleton'
import styles from './GamePage.module.css'

type BannerData = {
    name: string;
    username: string | undefined;
    avatar: string | null | undefined;
    time: number;
    color: "w" | "b";
    isActive: boolean;
    rating: number | null;
    ratingDelta: number | null;
    isProvisional: boolean;
    captured: {
        type: string;
        color: "w" | "b";
    }[];
    diff: number;
};

export default function GamePage() {
    const { t } = useTranslation()
    usePageTitle('page_title_game')

    const layoutContext = useOutletContext<LayoutContextType | undefined>()
    const challengeSocket = layoutContext?.challengeSocket

    const rematchState: 'idle' | 'sent' = challengeSocket?.outgoingChallenge?.isRematch ? 'sent' : 'idle'

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

    const [isFlipped, setIsFlipped] = useState(false)

    // Players start with themselves at the bottom, viewers with white
    const baseBottom: 'w' | 'b' = game.isViewer ? 'w' : game.playerColor
    const bottomColor: 'w' | 'b' = isFlipped ? (baseBottom === 'w' ? 'b' : 'w') : baseBottom

    const handleFlipBoard = () => setIsFlipped((prev) => !prev)

    const ranks = useMemo(
        () => (bottomColor === 'w' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8']),
        [bottomColor]
    )
    const files = useMemo(
        () => (bottomColor === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']),
        [bottomColor]
    )

    if (game.gameState === 'searching') {
        return (
            <div className={styles.gameContainer}>
                <main className={styles.gameMain}>
                    <div className={styles.gamePlayArea}>
                        <ChessSkeleton mode="game" />
                    </div>
                </main>
            </div>
        )
    }

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
    const blackBanner: BannerData = {
        name: game.blackPlayer?.username || (game.playerColor === 'w' ? game.opponentName : game.currentUser?.username) || 'Black',
        username: game.blackPlayer?.username || (game.playerColor === 'w' ? game.opponentName : game.currentUser?.username),
        avatar: game.blackPlayer?.avatar ?? (game.playerColor === 'w' ? game.opponentAvatar : game.currentUser?.avatar),
        time: game.blackTime,
        color: 'b' as const,
        isActive: game.turn === 'b' && !game.isGameOver && game.gameState === 'playing',
        rating: game.blackRatingAfter ?? game.blackPlayer?.rating ?? (game.playerColor === 'w' ? game.opponentRating : game.playerRating),
        ratingDelta: game.blackRatingDelta ?? game.blackPlayer?.ratingDelta ?? null,
        isProvisional: game.blackPlayer?.isProvisional ?? (game.playerColor === 'w' ? game.opponentIsProvisional : game.playerIsProvisional),
        captured: game.captured.w,
        diff: game.blackScore > game.whiteScore ? game.blackScore - game.whiteScore : 0,
    }

    const whiteBanner: BannerData = {
        name: game.whitePlayer?.username || (game.playerColor === 'w' ? game.currentUser?.username : game.opponentName) || 'White',
        username: game.whitePlayer?.username || (game.playerColor === 'w' ? game.currentUser?.username : game.opponentName),
        avatar: game.whitePlayer?.avatar ?? (game.playerColor === 'w' ? game.currentUser?.avatar : game.opponentAvatar),
        time: game.whiteTime,
        color: 'w' as const,
        isActive: game.turn === 'w' && !game.isGameOver && game.gameState === 'playing',
        rating: game.whiteRatingAfter ?? game.whitePlayer?.rating ?? (game.playerColor === 'w' ? game.playerRating : game.opponentRating),
        ratingDelta: game.whiteRatingDelta ?? game.whitePlayer?.ratingDelta ?? null,
        isProvisional: game.whitePlayer?.isProvisional ?? (game.playerColor === 'w' ? game.playerIsProvisional : game.opponentIsProvisional),
        captured: game.captured.b,
        diff: game.whiteScore > game.blackScore ? game.whiteScore - game.blackScore : 0,
    }

    const viewerTop = bottomColor === 'w' ? blackBanner : whiteBanner
    const viewerBottom = bottomColor === 'w' ? whiteBanner : blackBanner

    // Disconnected players for viewer
    const blackDisconnected = game.blackPlayer?.id !== undefined && game.disconnectedUserIds.includes(game.blackPlayer.id)
    const whiteDisconnected = game.whitePlayer?.id !== undefined && game.disconnectedUserIds.includes(game.whitePlayer.id)

    const viewerTopDisconnected = bottomColor === 'w' ? blackDisconnected : whiteDisconnected
    const viewerBottomDisconnected = bottomColor === 'w' ? whiteDisconnected : blackDisconnected

    const viewerTopId = bottomColor === 'w' ? game.blackPlayer?.id : game.whitePlayer?.id
    const viewerBottomId = bottomColor === 'w' ? game.whitePlayer?.id : game.blackPlayer?.id

    const opponentPlayer = game.playerColor === 'w' ? game.blackPlayer : game.whitePlayer
    const opponentDisconnected = opponentPlayer?.id !== undefined &&
        game.disconnectedUserIds.includes(opponentPlayer.id)

    const getDisconnectCountdown = (userId?: number) =>
        userId === undefined ? null : game.disconnectSecondsRemaining[userId] ?? null

    const renderViewerBanner = (
        player: BannerData,
        disconnected: boolean,
        playerId: number | undefined,
        isBottom: boolean
    ) => (
        <PlayerBanner
            name={player.name}
            username={player.username}
            avatar={player.avatar}
            color={player.color}
            time={player.time}
            isActive={player.isActive}
            isBottom={isBottom}
            rating={player.rating}
            ratingDelta={player.ratingDelta}
            isGameOver={game.isGameOver}
            isDisconnected={disconnected}
            disconnectCountdown={getDisconnectCountdown(playerId)}
            isProvisional={player.isProvisional}
            selectedMode={game.selectedMode}
            capturedPieces={player.captured}
            materialDiff={player.diff}
        />
    )

    const renderOpponentBanner = (isBottom: boolean) => (
        <PlayerBanner
            name={game.opponentName || t('opponent')}
            username={game.opponentName}
            avatar={game.opponentAvatar}
            color={opponentColor}
            time={game.playerColor === 'w' ? game.blackTime : game.whiteTime}
            isActive={game.turn !== game.playerColor && !game.isGameOver && game.gameState === 'playing'}
            isBottom={isBottom}
            rating={game.opponentRating}
            ratingDelta={game.playerColor === 'w' ? game.blackRatingDelta : game.whiteRatingDelta}
            isGameOver={game.isGameOver}
            isDisconnected={opponentDisconnected}
            disconnectCountdown={getDisconnectCountdown(opponentPlayer?.id)}
            isProvisional={game.opponentIsProvisional}
            selectedMode={game.selectedMode}
            capturedPieces={opponentCaptured}
            materialDiff={opponentDiff}
        />
    )

    const renderMyBanner = (isBottom: boolean) => (
        <PlayerBanner
            name={game.currentUser?.username || t('you')}
            username={game.currentUser?.username}
            avatar={game.currentUser?.avatar}
            color={game.playerColor}
            time={game.playerColor === 'w' ? game.whiteTime : game.blackTime}
            isActive={game.turn === game.playerColor && !game.isGameOver && game.gameState === 'playing'}
            isBottom={isBottom}
            rating={game.playerRating}
            ratingDelta={game.playerRatingDelta ?? (game.playerColor === 'w' ? game.whiteRatingDelta : game.blackRatingDelta)}
            isGameOver={game.isGameOver}
            isProvisional={game.playerIsProvisional}
            initialRatings={game.currentUser?.ratings}
            selectedMode={game.selectedMode}
            capturedPieces={playerCaptured}
            materialDiff={playerDiff}
        />
    )

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
                        
                        {game.isViewer
                            ? renderViewerBanner(viewerTop, viewerTopDisconnected, viewerTopId, false)
                            : isFlipped ? renderMyBanner(false) : renderOpponentBanner(false)}

                        <ChessBoard
                            displayChess={game.displayChess}
                            displayFen={game.displayFen}
                            ranks={ranks}
                            files={files}
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
                            onSquareClick={board.handleSquareClick}
                            onSquareSelect={board.handleSquareSelect}
                            onPieceDrop={board.handlePieceDrop}
                            onPromotionSelect={board.handlePromotionSelect}
                            onPromotionCancel={board.handlePromotionCancel}
                            isGameOver={game.isGameOver}
                            isViewer={game.isViewer}
                            winnerColor={game.isGameOver && game.viewIndex === game.moveHistory.length - 1 ? game.winnerColor : null}
                        />

                        {game.isViewer
                            ? renderViewerBanner(viewerBottom, viewerBottomDisconnected, viewerBottomId, true)
                            : isFlipped ? renderOpponentBanner(true) : renderMyBanner(true)}
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
                        gameOverReason={game.gameOverReason}
                        isViewer={game.isViewer}
                        onSelectIndex={game.setViewIndex}
                        onResign={game.resignGame}
                        drawOfferState={game.drawOfferState}
                        onOfferDraw={game.offerDraw}
                        onAcceptDraw={game.acceptDraw}
                        onDeclineDraw={game.declineDraw}
                        onAnalyze={game.analyzeGame}
                        onExportPgn={game.exportPgn}
                        onPlayAgain={() => {
                            game.setIsGameOver(false)
                            game.startMatchmaking()
                        }}
                        onFlipBoard={handleFlipBoard}
                    />
                </div>

                {game.isGameOver && !game.hideGameOverModal && game.currentUser && (
                    <GameOverDialog
                        gameId={game.gameId}
                        currentUser={game.currentUser}
                        winnerColor={game.winnerColor}
                        playerColor={game.playerColor}
                        gameOverReason={game.gameOverReason}
                        mode={game.selectedMode}
                        ratingAfter={game.playerRatingAfter}
                        ratingDelta={game.playerRatingDelta}
                        leaderboardRating={game.playerLeaderboardRating}
                        leaderboardRank={game.playerLeaderboardRank}
                        leaderboardRankDelta={game.playerLeaderboardRankDelta}
                        isViewer={game.isViewer}
                        showConfetti={game.showConfetti}
                        onConfettiComplete={() => game.setShowConfetti(false)}
                        analysis={game.gameAnalysis}
                        isAnalysisLoading={game.isAnalysisLoading}
                        onClose={() => game.setHideGameOverModal(true)}
                        onPlayAgain={() => {
                            game.setIsGameOver(false)
                            game.startMatchmaking()
                        }}
                        rematchState={rematchState}
                        onRematch={() => {
                            if (challengeSocket?.incomingChallenge?.isRematch) {
                                challengeSocket.acceptChallenge(challengeSocket.incomingChallenge.challengeId)
                            } else if (game.gameId && challengeSocket) {
                                challengeSocket.sendRematch(game.gameId)
                            }
                        }}
                        onAnalyze={game.analyzeGame}
                    />
                )}
            </main>
        </div>
    )
}
