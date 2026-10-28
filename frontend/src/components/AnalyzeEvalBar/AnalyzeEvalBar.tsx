import type { EvalInfo } from '../../utils/analyzeUtils'
import styles from './AnalyzeEvalBar.module.css'

interface AnalyzeEvalBarProps {
    evalInfo: EvalInfo
}

export default function AnalyzeEvalBar({ evalInfo }: AnalyzeEvalBarProps) {
    const whiteBarHeight = evalInfo.winChanceWhite

    return (
        <div className={styles.evalBarWrapper}>
            <span className={styles.evalSideHint}>B</span>
            <div className={styles.evalBarContainer}>
                <div
                    className={styles.evalBarWhite}
                    style={{ height: `${whiteBarHeight}%` }}
                />
                <div className={styles.evalBarBlack} />

                <span
                    className={`${styles.evalBarLabel} ${
                        whiteBarHeight >= 50 ? styles.evalWhiteSide : styles.evalBlackSide
                    }`}
                >
                    {evalInfo.scoreText}
                </span>
            </div>
            <span className={styles.evalSideHint}>W</span>
        </div>
    )
}
