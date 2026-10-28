import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAnalyzeState } from '../../hooks/useAnalyzeState'
import { useAnalyzeEngine } from '../../hooks/useAnalyzeEngine'
import { useAnalyzeBoard } from '../../hooks/useAnalyzeBoard'

import ChessBoard from '../../components/ChessBoard/ChessBoard'
import PlayerBanner from '../../components/PlayerBanner/Playerbanner'
import ChessSkeleton from '../../components/ChessSkeleton/ChessSkeleton'
import AnalyzeEvalBar from '../../components/AnalyzeEvalBar/AnalyzeEvalBar'
import AnalyzeInfoPanel from '../../components/AnalyzeInfoPanel/AnalyzeInfoPanel'
import AnalyzePgnModal from '../../components/AnalyzePgnModal/AnalyzePgnModal'
import AnalyzeGamesModal from '../../components/AnalyzeGamesModal/AnalyzeGamesModal'

import styles from './AnalyzePage.module.css'

export default function AnalyzePage() {
    usePageTitle('page_title_interactive_analysis')
    const { id } = useParams<{ id?: string }>()

    const [showPgnModal, setShowPgnModal] = useState<boolean>(false)
    const [showGamesModal, setShowGamesModal] = useState<boolean>(false)

    // 1. Core analysis state (history, PGN, navigation, orientation)
    const state = useAnalyzeState({ gameId: id })

    // 2. Engine evaluation & telemetry
    const engine = useAnalyzeEngine({
        currentFen: state.currentFen,
        displayChess: state.displayChess,
        viewIndex: state.viewIndex,
        moveHistory: state.moveHistory,
        moveDetails: state.moveDetails,
        analysisData: state.analysisData,
    })

    // 3. Interactive board controls (click, drag-and-drop, promotion)
    const board = useAnalyzeBoard({
        displayChess: state.displayChess,
        currentTurn: state.currentTurn,
        onMove: state.executeMove,
    })

    const handleResetAll = () => {
        state.handleReset()
        engine.resetEngine()
        board.resetSelection()
    }

    if (state.isLoadingGame) {
        return (
            <div className={styles.container}>
                <main className={styles.main}>
                    <div className={styles.playArea}>
                        <ChessSkeleton mode="analyze" />
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.playArea}>
                    {/* Left Board & Eval Bar Area */}
                    <div className={styles.boardAreaWithEval}>
                        {/* Evaluation Bar */}
                        <AnalyzeEvalBar evalInfo={engine.evalInfo} />

                        {/* Chess Board Container with Top and Bottom Player Banners */}
                        <div
                            className={styles.boardContainer}
                            onContextMenu={board.handleContextMenu}
                        >
                            {/* Top Banner (Black if normal orientation, White if flipped) */}
                            <PlayerBanner
                                name={state.topBanner.name}
                                username={state.topBanner.username}
                                rating={state.topBanner.rating}
                                color={state.topBanner.color}
                                time={0}
                                isActive={state.currentTurn === state.topBanner.color}
                                hideClock={true}
                                capturedPieces={state.topBanner.capturedPieces}
                                materialDiff={state.topBanner.materialDiff}
                            />

                            {/* Main Interactive ChessBoard */}
                            <ChessBoard
                                displayChess={state.displayChess}
                                displayFen={state.currentFen}
                                ranks={state.ranks}
                                files={state.files}
                                selectedSquare={board.selectedSquare}
                                validMoves={board.validMoves}
                                lastMove={state.currentLastMove}
                                premoveSquares={new Set()}
                                isReviewing={false}
                                isCheck={state.isCheck}
                                turn={state.currentTurn}
                                playerColor={state.currentTurn}
                                showPromotion={board.showPromotion}
                                promotionSquare={board.promotionSquare}
                                isPaused={false}
                                onSquareClick={board.handleSquareClick}
                                onSquareSelect={board.handleSquareSelect}
                                onPieceDrop={board.handlePieceDrop}
                                onPromotionSelect={board.handlePromotionSelect}
                                onPromotionCancel={board.handlePromotionCancel}
                                isGameOver={state.isGameOver}
                                isViewer={false}
                                winnerColor={state.winnerColor}
                                customArrows={engine.customArrows}
                                moveClassification={engine.currentMoveClassification}
                            />

                            {/* Bottom Banner (White if normal orientation, Black if flipped) */}
                            <PlayerBanner
                                name={state.bottomBanner.name}
                                username={state.bottomBanner.username}
                                rating={state.bottomBanner.rating}
                                color={state.bottomBanner.color}
                                time={0}
                                isActive={state.currentTurn === state.bottomBanner.color}
                                isBottom={true}
                                hideClock={true}
                                capturedPieces={state.bottomBanner.capturedPieces}
                                materialDiff={state.bottomBanner.materialDiff}
                            />
                        </div>
                    </div>

                    {/* Right Side Info Panel */}
                    <AnalyzeInfoPanel
                        analysisData={state.analysisData}
                        evalInfo={engine.evalInfo}
                        engineLines={engine.engineLines}
                        selectedLineIndex={engine.selectedLineIndex}
                        isEvaluating={engine.isEvaluating}
                        displayChess={state.displayChess}
                        onSelectEngineLine={engine.handleSelectEngineLine}
                        moveHistory={state.moveHistory}
                        moveSAN={state.moveSAN}
                        viewIndex={state.viewIndex}
                        moveListRef={state.moveListRef}
                        onSelectIndex={state.setViewIndex}
                        onGoToStart={state.goToStart}
                        onGoToPrev={state.goToPrev}
                        onGoToNext={state.goToNext}
                        onGoToEnd={state.goToEnd}
                        onOpenPgnModal={() => setShowPgnModal(true)}
                        onOpenGamesModal={() => setShowGamesModal(true)}
                        onFlipBoard={state.handleFlipBoard}
                        onResetBoard={handleResetAll}
                    />
                </div>

                {/* Modal: Load PGN / Upload */}
                <AnalyzePgnModal
                    isOpen={showPgnModal}
                    onClose={() => setShowPgnModal(false)}
                    onLoadPgn={(pgn) => state.loadPgnString(pgn, true)}
                />

                {/* Modal: Analyze Existing Games */}
                <AnalyzeGamesModal
                    isOpen={showGamesModal}
                    onClose={() => setShowGamesModal(false)}
                    onSelectGame={state.handleSelectPastGame}
                />
            </main>
        </div>
    )
}
