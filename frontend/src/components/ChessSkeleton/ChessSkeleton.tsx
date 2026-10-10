import styles from './ChessSkeleton.module.css'

interface Props {
    mode?: 'analyze' | 'game'
}

export default function ChessSkeleton({ mode = 'analyze' }: Props) {
    return (
        <>
            <div className={styles.boardContainer}>
                {/* Top Banner Skeleton */}
                <div className={styles.bannerSkeleton}>
                    <div className={styles.bannerLeft}>
                        <div className={`${styles.skeleton} ${styles.avatarSkeleton}`} />
                        <div className={styles.bannerText}>
                            <div className={`${styles.skeleton} ${styles.nameSkeleton}`} />
                            <div className={`${styles.skeleton} ${styles.ratingSkeleton}`} />
                        </div>
                    </div>
                    <div className={`${styles.skeleton} ${styles.clockSkeleton}`} />
                </div>

                {/* Board Skeleton Grid */}
                <div className={styles.boardSkeleton}>
                    <div className={styles.boardGrid}>
                        {Array.from({ length: 64 }).map((_, i) => {
                            const row = Math.floor(i / 8)
                            const col = i % 8
                            const isDark = (row + col) % 2 === 1
                            return (
                                <div
                                    key={i}
                                    className={`${styles.boardCell} ${
                                        isDark ? styles.boardCellDark : styles.boardCellLight
                                    }`}
                                />
                            )
                        })}
                    </div>
                    <div className={styles.boardShimmerOverlay} />
                </div>

                {/* Bottom Banner Skeleton */}
                <div className={styles.bannerSkeleton}>
                    <div className={styles.bannerLeft}>
                        <div className={`${styles.skeleton} ${styles.avatarSkeleton}`} />
                        <div className={styles.bannerText}>
                            <div className={`${styles.skeleton} ${styles.nameSkeleton}`} />
                            <div className={`${styles.skeleton} ${styles.ratingSkeleton}`} />
                        </div>
                    </div>
                    <div className={`${styles.skeleton} ${styles.clockSkeleton}`} />
                </div>
            </div>

            {/* Right Side Info Panel Skeleton */}
            <div className={styles.infoPanel}>
                <div className={styles.panelHeader}>
                    <div className={`${styles.skeleton} ${styles.headerTitleSkeleton}`} />
                    <div className={`${styles.skeleton} ${styles.headerBadgeSkeleton}`} />
                </div>

                {mode === 'analyze' && (
                    <div className={styles.engineBannerSkeleton}>
                        <div className={`${styles.skeleton} ${styles.engineScoreSkeleton}`} />
                        <div className={`${styles.skeleton} ${styles.engineDepthSkeleton}`} />
                    </div>
                )}

                <div className={styles.moveListSkeleton}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className={styles.moveRowSkeleton}>
                            <div className={`${styles.skeleton} ${styles.moveNumSkeleton}`} />
                            <div className={`${styles.skeleton} ${styles.moveColSkeleton}`} />
                            <div className={`${styles.skeleton} ${styles.moveColSkeleton}`} />
                        </div>
                    ))}
                </div>

                <div className={styles.footerActionsSkeleton}>
                    <div className={`${styles.skeleton} ${styles.actionBtnSkeleton}`} />
                    <div className={`${styles.skeleton} ${styles.actionBtnSkeleton}`} />
                </div>
            </div>
        </>
    )
}
