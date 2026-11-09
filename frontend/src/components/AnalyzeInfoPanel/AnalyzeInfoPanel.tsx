import { useTranslation } from 'react-i18next'
import { Brain } from 'lucide-react'
import type { Chess } from 'chess.js'
import type { GameAnalysisResult } from '../../utils/gameUtils'
import type { EvalInfo, EvaluationLine } from '../../utils/analyzeUtils'
import AnalyzeEnginePanel from '../AnalyzeEnginePanel/AnalyzeEnginePanel'
import MoveHistory from '../MoveHistory/MoveHistory'
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
    onSelectIndex: (idx: number) => void
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
    onSelectIndex,
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

            <MoveHistory
                moveHistory={moveHistory}
                moveSAN={moveSAN}
                viewIndex={viewIndex}
                onSelectIndex={onSelectIndex}
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
