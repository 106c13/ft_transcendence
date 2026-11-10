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

const AnalyzePage = () => {
    usePageTitle('page_title_interactive_analysis')
    const { gameid } = useParams<{ gameid?: string }>()

    const [showPgnModal, setShowPgnModal] = useState<boolean>(false)
    const [showGamesModal, setShowGamesModal] = useState<boolean>(false)

    // 1. Core analysis state (history, PGN, navigation, orientation)
    const state = useAnalyzeState({ gameId: gameid })

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

    const containerClass = `${styles.container} flex flex-col min-h-screen min-[951px]:h-dvh min-[951px]:max-h-dvh bg-[linear-gradient(135deg,#0F172A_0%,#1E293B_100%)] text-slate-200 pt-16 box-border overflow-y-auto min-[951px]:overflow-hidden`
    const mainClass = "flex-1 px-3 pt-[var(--game-gap)] pb-[30px] min-[951px]:px-4 min-[951px]:py-[var(--game-gap)] flex flex-col items-center justify-center overflow-y-auto min-[951px]:overflow-hidden box-border w-full min-h-0"
    const playAreaClass = "flex flex-col min-[951px]:flex-row gap-4 items-center min-[951px]:items-stretch justify-center w-full max-w-[1280px] h-auto min-[951px]:h-[var(--game-content-h)] min-[951px]:max-h-[var(--game-content-h)] mx-auto box-border"

    if (state.isLoadingGame) {
        return (
            <div className={containerClass}>
                <main className={mainClass}>
                    <div className={playAreaClass}>
                        <ChessSkeleton mode="analyze" />
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className={containerClass}>
            <main className={mainClass}>
                <div className={playAreaClass}>
                    {/* Left Board & Eval Bar Area */}
                    <div className="flex items-center justify-center min-[951px]:justify-start gap-[var(--eval-gap)] w-full min-[951px]:w-auto h-auto min-[951px]:h-[var(--game-content-h)] min-[951px]:max-h-[var(--game-content-h)] box-border">
                        {/* Evaluation Bar */}
                        <AnalyzeEvalBar evalInfo={engine.evalInfo} />

                        {/* Chess Board Container with Top and Bottom Player Banners */}
                        <div
                            className="flex flex-col items-center justify-between relative w-[var(--board-size)] h-auto min-[951px]:h-[var(--game-content-h)] min-[951px]:max-h-[var(--game-content-h)] shrink-0 box-border"
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
                        onSelectIndex={state.setViewIndex}
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
    );
};

export default AnalyzePage;
