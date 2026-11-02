import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Swords, X } from 'lucide-react'
import type { MatchRecord } from '../../utils/gameUtils'
import type { LayoutContextType } from '../../utils/layoutContextUtils'
import SimpleGameRow from '../SimpleGameRow/SimpleGameRow'
import styles from './AnalyzeGamesModal.module.css'

interface AnalyzeGamesModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectGame: (game: MatchRecord) => void
}

const GAMES_PER_PAGE = 5

export default function AnalyzeGamesModal({
    isOpen,
    onClose,
    onSelectGame,
}: AnalyzeGamesModalProps) {
    const { t } = useTranslation()
    const { currentUser } = useOutletContext<LayoutContextType>()
    const [userGames, setUserGames] = useState<MatchRecord[]>([])
    const [isLoadingGames, setIsLoadingGames] = useState<boolean>(false)
    const [gamesPage, setGamesPage] = useState<number>(1)
    const currentUsername = currentUser?.username || ''

    useEffect(() => {
        if (!isOpen) return

        let isCancelled = false
        setIsLoadingGames(true)
        setGamesPage(1)

        const fetchUserGames = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token || !currentUsername) {
                    setIsLoadingGames(false)
                    return
                }

                const gamesRes = await fetch(`/api/game/history/${currentUsername}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (gamesRes.ok && !isCancelled) {
                    const games: MatchRecord[] = await gamesRes.json()
                    setUserGames(games)
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error('Failed to load past games:', err)
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingGames(false)
                }
            }
        }

        fetchUserGames()

        return () => {
            isCancelled = true
        }
    }, [isOpen, currentUsername])

    if (!isOpen) return null

    const totalPages = Math.ceil(userGames.length / GAMES_PER_PAGE) || 1
    const pagedGames = userGames.slice(
        (gamesPage - 1) * GAMES_PER_PAGE,
        gamesPage * GAMES_PER_PAGE
    )

    const handleSelect = (game: MatchRecord) => {
        onSelectGame(game)
        onClose()
    }

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>
                        <Swords size={18} />
                        {t('select_game_to_analyze')}
                    </h3>
                    <button
                        type="button"
                        className={styles.modalCloseBtn}
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {isLoadingGames ? (
                        <div className={styles.emptyMoves}>
                            <p>{t('loading', 'Loading games...')}</p>
                        </div>
                    ) : userGames.length === 0 ? (
                        <div className={styles.emptyMoves}>
                            <p>{t('no_games_found')}</p>
                        </div>
                    ) : (
                        <div className={styles.gamesList}>
                            {pagedGames.map((game) => (
                                <SimpleGameRow
                                    key={game.id}
                                    match={game}
                                    currentUsername={currentUsername}
                                    onSelect={handleSelect}
                                />
                            ))}
                        </div>
                    )}

                    {!isLoadingGames && userGames.length > GAMES_PER_PAGE && (
                        <div className={styles.modalPagination}>
                            <button
                                type="button"
                                className={styles.pageBtn}
                                disabled={gamesPage <= 1}
                                onClick={() => setGamesPage((p) => Math.max(1, p - 1))}
                            >
                                ← {t('prev_nav', 'Prev')}
                            </button>
                            <span className={styles.pageInfo}>
                                {gamesPage} / {totalPages}
                            </span>
                            <button
                                type="button"
                                className={styles.pageBtn}
                                disabled={gamesPage >= totalPages}
                                onClick={() => setGamesPage((p) => Math.min(totalPages, p + 1))}
                            >
                                {t('next_nav', 'Next')} →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
