import { useTranslation } from 'react-i18next'
import { Brain } from 'lucide-react'
import type { Chess } from 'chess.js'
import type { GameAnalysisResult } from '../../utils/gameUtils'
import type { EvalInfo, EvaluationLine } from '../../utils/analyzeUtils'
import AnalyzeEnginePanel from '../AnalyzeEnginePanel/AnalyzeEnginePanel'
import AnalyzeMoveList from '../AnalyzeMoveList/AnalyzeMoveList'
import AnalyzeToolbar from '../AnalyzeToolbar/AnalyzeToolbar'
import styles from './AnalyzeInfoPanel.module.css'

interface AnalyzeInfoPanelProps {
    analysisData: GameAnalysisResult | null
    evalInfo: EvalInfo
    engineLines: EvaluationLine[]
    selectedLineIndex: number
    isEvaluating: boolean
    displayChess: Chess
    onSelectEngineLine: (index: number) => void
    moveHistory: string[]
    moveSAN: string[]
    viewIndex: number
    moveListRef?: React.RefObject<HTMLDivElement | null>
    onSelectIndex: (idx: number) => void
    onGoToStart: () => void
    onGoToPrev: () => void
    onGoToNext: () => void
    onGoToEnd: () => void
    onOpenPgnModal: () => void
    onOpenGamesModal: () => void
    onFlipBoard: () => void
    onResetBoard: () => void
}

export default function AnalyzeInfoPanel({
    analysisData,
    evalInfo,
    engineLines,
    selectedLineIndex,
    isEvaluating,
    displayChess,
    onSelectEngineLine,
    moveHistory,
    moveSAN,
    viewIndex,
    moveListRef,
    onSelectIndex,
    onGoToStart,
    onGoToPrev,
    onGoToNext,
    onGoToEnd,
    onOpenPgnModal,
    onOpenGamesModal,
    onFlipBoard,
    onResetBoard,
}: AnalyzeInfoPanelProps) {
    const { t } = useTranslation()

    return (
        <div className={styles.infoPanel}>
            <div className={styles.panelHeader}>
                <h3>
                    <Brain size={18} />
                    {t('analysis_board')}
                </h3>
                <span className={styles.modeBadge}>
                    {analysisData
                        ? `Acc: W ${analysisData.accuracy.white}% • B ${analysisData.accuracy.black}%`
                        : t('interactive_analysis')}
                </span>
            </div>

            <AnalyzeEnginePanel
                evalInfo={evalInfo}
                engineLines={engineLines}
                selectedLineIndex={selectedLineIndex}
                isEvaluating={isEvaluating}
                displayChess={displayChess}
                onSelectEngineLine={onSelectEngineLine}
            />

            <AnalyzeMoveList
                moveHistory={moveHistory}
                moveSAN={moveSAN}
                viewIndex={viewIndex}
                analysisData={analysisData}
                moveListRef={moveListRef}
                onSelectIndex={onSelectIndex}
                onGoToStart={onGoToStart}
                onGoToPrev={onGoToPrev}
                onGoToNext={onGoToNext}
                onGoToEnd={onGoToEnd}
            />

            <AnalyzeToolbar
                onOpenPgnModal={onOpenPgnModal}
                onOpenGamesModal={onOpenGamesModal}
                onFlipBoard={onFlipBoard}
                onResetBoard={onResetBoard}
            />
        </div>
    )
}
