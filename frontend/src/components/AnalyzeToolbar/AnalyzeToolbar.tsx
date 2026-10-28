import { useTranslation } from 'react-i18next'
import { ScrollText, History, FlipHorizontal2, RotateCcw } from 'lucide-react'
import Tooltip from '../Tooltip/Tooltip'
import styles from './AnalyzeToolbar.module.css'

interface AnalyzeToolbarProps {
    onOpenPgnModal: () => void
    onOpenGamesModal: () => void
    onFlipBoard: () => void
    onResetBoard: () => void
}

export default function AnalyzeToolbar({
    onOpenPgnModal,
    onOpenGamesModal,
    onFlipBoard,
    onResetBoard,
}: AnalyzeToolbarProps) {
    const { t } = useTranslation()

    return (
        <div className={styles.gameActions}>
            <div className={styles.actionRow}>
                <Tooltip content={t('load_pgn')} position="top" className={styles.actionTooltip}>
                    <button
                        type="button"
                        className={styles.actionBtnNeutral}
                        onClick={onOpenPgnModal}
                        aria-label={t('load_pgn')}
                    >
                        <ScrollText size={15} />
                    </button>
                </Tooltip>

                <Tooltip content={t('analyze_existing_game')} position="top" className={styles.actionTooltip}>
                    <button
                        type="button"
                        className={styles.actionBtnNeutral}
                        onClick={onOpenGamesModal}
                        aria-label={t('analyze_existing_game')}
                    >
                        <History size={15} />
                    </button>
                </Tooltip>

                <Tooltip content={t('flip_board')} position="top" className={styles.actionTooltip}>
                    <button
                        type="button"
                        className={styles.actionBtnNeutral}
                        onClick={onFlipBoard}
                        aria-label={t('flip_board')}
                    >
                        <FlipHorizontal2 size={15} />
                    </button>
                </Tooltip>

                <Tooltip content={t('reset_board')} position="top" className={styles.actionTooltip}>
                    <button
                        type="button"
                        className={styles.actionBtnNeutral}
                        onClick={onResetBoard}
                        aria-label={t('reset_board')}
                    >
                        <RotateCcw size={15} />
                    </button>
                </Tooltip>
            </div>
        </div>
    )
}
