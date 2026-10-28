import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollText, SkipBack, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import type { GameAnalysisResult } from '../../utils/gameUtils'
import styles from './AnalyzeMoveList.module.css'

interface AnalyzeMoveListProps {
    moveHistory: string[]
    moveSAN: string[]
    viewIndex: number
    analysisData: GameAnalysisResult | null
    moveListRef?: React.RefObject<HTMLDivElement | null>
    onSelectIndex: (idx: number) => void
    onGoToStart: () => void
    onGoToPrev: () => void
    onGoToNext: () => void
    onGoToEnd: () => void
}

export default function AnalyzeMoveList({
    moveHistory,
    moveSAN,
    viewIndex,
    analysisData,
    moveListRef,
    onSelectIndex,
    onGoToStart,
    onGoToPrev,
    onGoToNext,
    onGoToEnd,
}: AnalyzeMoveListProps) {
    const { t } = useTranslation()

    const halfMoves = moveHistory.length - 1
    const moveRows = useMemo(() => {
        const rows = []
        for (let i = 0; i < halfMoves; i += 2) {
            rows.push({
                num: Math.floor(i / 2) + 1,
                whiteIdx: i,
                blackIdx: i + 1,
                whiteSan: moveSAN[i] ?? '',
                blackSan: moveSAN[i + 1] ?? '',
            })
        }
        return rows
    }, [halfMoves, moveSAN])

    const getBadge = (cls?: string) => {
        switch (cls) {
            case 'brilliant':
                return { glyph: '!!', color: '#06b6d4' }
            case 'great':
                return { glyph: '!', color: '#0ea5e9' }
            case 'best':
                return { glyph: '★', color: '#10b981' }
            case 'inaccuracy':
                return { glyph: '?!', color: '#eab308' }
            case 'mistake':
                return { glyph: '?', color: '#f97316' }
            case 'blunder':
                return { glyph: '??', color: '#ef4444' }
            default:
                return null
        }
    }

    return (
        <div className={styles.moveLogWrapper}>
            <div className={styles.moveList} ref={moveListRef}>
                {moveRows.length === 0 ? (
                    <div className={styles.emptyHistory}>
                        <div className={styles.emptyHistoryIcon}>
                            <ScrollText size={36} aria-hidden="true" />
                        </div>
                        <span className={styles.emptyHistoryTitle}>
                            {t('no_moves_yet')}
                        </span>
                        <span className={styles.emptyHistorySubtitle}>
                            {t('moves_appear_here')}
                        </span>
                    </div>
                ) : (
                    moveRows.map((row) => {
                        const whiteActive = viewIndex === row.whiteIdx + 1
                        const blackActive = viewIndex === row.blackIdx + 1

                        const whiteAnalysis = analysisData?.positions[row.whiteIdx]
                        const blackAnalysis = analysisData?.positions[row.blackIdx]

                        const whiteBadge = getBadge(whiteAnalysis?.classification)
                        const blackBadge = getBadge(blackAnalysis?.classification)

                        return (
                            <div key={row.num} className={styles.moveRow}>
                                <span className={styles.moveRowNum}>{row.num}.</span>
                                <button
                                    type="button"
                                    data-active-move={whiteActive ? 'true' : undefined}
                                    className={`${styles.moveBtn} ${whiteActive ? styles.activeMove : ''}`}
                                    onClick={() => onSelectIndex(row.whiteIdx + 1)}
                                >
                                    <span>{row.whiteSan}</span>
                                    {whiteBadge && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 800,
                                                color: whiteBadge.color,
                                                marginLeft: 4,
                                            }}
                                            title={whiteAnalysis?.classification}
                                        >
                                            {whiteBadge.glyph}
                                        </span>
                                    )}
                                </button>
                                {row.blackSan ? (
                                    <button
                                        type="button"
                                        data-active-move={blackActive ? 'true' : undefined}
                                        className={`${styles.moveBtn} ${blackActive ? styles.activeMove : ''}`}
                                        onClick={() => onSelectIndex(row.blackIdx + 1)}
                                    >
                                        <span>{row.blackSan}</span>
                                        {blackBadge && (
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    color: blackBadge.color,
                                                    marginLeft: 4,
                                                }}
                                                title={blackAnalysis?.classification}
                                            >
                                                {blackBadge.glyph}
                                            </span>
                                        )}
                                    </button>
                                ) : (
                                    <span className={styles.emptyMoveBtn} />
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Move Navigation Bar */}
            <div className={styles.moveNavRow}>
                <button
                    type="button"
                    className={styles.navBtn}
                    title={t('start_nav', 'Start')}
                    onClick={onGoToStart}
                    disabled={viewIndex === 0}
                >
                    <SkipBack size={16} />
                </button>
                <button
                    type="button"
                    className={styles.navBtn}
                    title={t('prev_nav', 'Previous')}
                    onClick={onGoToPrev}
                    disabled={viewIndex === 0}
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    type="button"
                    className={styles.navBtn}
                    title={t('next_nav', 'Next')}
                    onClick={onGoToNext}
                    disabled={viewIndex >= moveHistory.length - 1}
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    type="button"
                    className={styles.navBtn}
                    title={t('end_nav', 'End')}
                    onClick={onGoToEnd}
                    disabled={viewIndex >= moveHistory.length - 1}
                >
                    <SkipForward size={16} />
                </button>
            </div>
        </div>
    )
}
