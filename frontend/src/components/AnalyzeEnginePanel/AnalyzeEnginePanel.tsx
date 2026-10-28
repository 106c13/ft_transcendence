import { useTranslation } from 'react-i18next'
import type { Chess } from 'chess.js'
import type { EvalInfo, EvaluationLine } from '../../utils/analyzeUtils'
import { formatLineScore } from '../../utils/analyzeUtils'
import styles from './AnalyzeEnginePanel.module.css'

interface AnalyzeEnginePanelProps {
    evalInfo: EvalInfo
    engineLines: EvaluationLine[]
    selectedLineIndex: number
    isEvaluating: boolean
    displayChess: Chess
    onSelectEngineLine: (index: number) => void
}

export default function AnalyzeEnginePanel({
    evalInfo,
    engineLines,
    selectedLineIndex,
    isEvaluating,
    displayChess,
    onSelectEngineLine,
}: AnalyzeEnginePanelProps) {
    const { t } = useTranslation()

    return (
        <div className={styles.engineBanner}>
            <div className={styles.engineBannerTop}>
                <div className={styles.engineScoreGroup}>
                    <span className={styles.engineScore}>{evalInfo.scoreText}</span>
                    {engineLines[selectedLineIndex] && (
                        <span className={styles.depthTag}>
                            depth {engineLines[selectedLineIndex].depth || 14}
                        </span>
                    )}
                </div>
                <span className={styles.engineStatus}>
                    {isEvaluating ? (
                        t('evaluating')
                    ) : displayChess.isCheckmate() ? (
                        t('checkmate')
                    ) : displayChess.isDraw() ? (
                        t('draw')
                    ) : evalInfo.score > 200 ? (
                        t('white_winning', 'White is winning')
                    ) : evalInfo.score < -200 ? (
                        t('black_winning', 'Black is winning')
                    ) : (
                        t('equal_position', 'Equal position')
                    )}
                </span>
            </div>

            {engineLines.length > 0 && (
                <div className={styles.engineLinesList}>
                    {engineLines.map((line, idx) => {
                        const isSelected = selectedLineIndex === idx
                        const lineScore = formatLineScore(line.score, line.mate)
                        const movesStr =
                            line.pvSan && line.pvSan.length > 0
                                ? line.pvSan.slice(0, 8).join(' ')
                                : line.bestMoveSan || line.bestMove

                        return (
                            <div
                                key={idx}
                                className={`${styles.engineLineItem} ${isSelected ? styles.activeLine : ''}`}
                                onClick={() => onSelectEngineLine(idx)}
                                title={t('click_to_view_line', 'Click to view engine arrow')}
                            >
                                <span className={styles.engineLineRank}>{idx + 1}</span>
                                <span className={styles.engineLineScore}>{lineScore}</span>
                                <span className={styles.engineLineMoves}>{movesStr}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
