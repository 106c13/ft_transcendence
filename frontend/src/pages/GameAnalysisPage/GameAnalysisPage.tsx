import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGameHistory } from '../../hooks/useGameHistory'
import { useGameAnalysis } from '../../hooks/useGameAnalysis'
import GameAnalysis from '../../components/GameAnalysis/GameAnalysis'
import type { MatchRecord } from '../../components/GameAnalysis/GameAnalysis'
import styles from './GameAnalysisPage.module.css'

export default function GameAnalysisPage() {
	const { t } = useTranslation()
	const { id, username: routeUsername } = useParams<{ id: string; username?: string }>()
	const navigate = useNavigate()
	const location = useLocation()

	const stateMatch = (location.state as any)?.match as MatchRecord | undefined
	const fromUsername = (location.state as any)?.fromUsername as string | undefined

	const [match, setMatch] = useState<MatchRecord | null>(stateMatch || null)
	const [loadingMatch, setLoadingMatch] = useState(!stateMatch)
	const [error, setError] = useState<string | null>(null)
	const [targetUsername, setTargetUsername] = useState<string>(fromUsername || routeUsername || '')

	const history = useGameHistory(targetUsername)
	const analysis = useGameAnalysis()

	// 1. If match is not passed in location state, fetch it from backend
	useEffect(() => {
		if (stateMatch) {
			setMatch(stateMatch)
			setLoadingMatch(false)
			return
		}

		if (!id) {
			setError(t('game_not_found', 'Game not found'))
			setLoadingMatch(false)
			return
		}

		const fetchMatch = async () => {
			setLoadingMatch(true)
			try {
				const token = localStorage.getItem('token')
				const res = await fetch(`/api/game/${id}`, {
					headers: { Authorization: `Bearer ${token}` },
				})

				if (res.ok) {
					const data: MatchRecord = await res.json()
					setMatch(data)
				} else {
					setError(t('game_not_found', 'Game not found'))
				}
			} catch (err) {
				console.error('Failed to load match:', err)
				setError(t('game_not_found', 'Game not found'))
			} finally {
				setLoadingMatch(false)
			}
		}

		fetchMatch()
	}, [id, stateMatch, t])

	// 2. Resolve username for user perspective if not known
	useEffect(() => {
		if (targetUsername) return

		const resolveUser = async () => {
			try {
				const token = localStorage.getItem('token')
				if (!token) return

				const res = await fetch('/api/users/me', {
					headers: { Authorization: `Bearer ${token}` },
				})

				if (res.ok) {
					const me = await res.json()
					if (match) {
						if (match.white?.username === me.username || match.black?.username === me.username) {
							setTargetUsername(me.username)
						} else {
							setTargetUsername(match.white?.username || me.username)
						}
					} else {
						setTargetUsername(me.username)
					}
				}
			} catch {
				// ignore
			}
		}

		resolveUser()
	}, [targetUsername, match])

	// 3. Trigger analysis once match is available
	useEffect(() => {
		if (match && analysis.selectedGame?.id !== match.id) {
			analysis.selectGame(match)
		}
	}, [match, analysis])

	const handleBack = () => {
		if (targetUsername) {
			navigate(`/profile/${targetUsername}`, { state: { defaultTab: 'games' } })
		} else {
			navigate(-1)
		}
	}

	if (error) {
		return (
			<div className={styles.page}>
				<div className={styles.breadcrumb}>
					<button className={styles.backBtn} onClick={() => navigate(-1)}>
						← {t('back', 'Back')}
					</button>
				</div>
				<div className={styles.errorCard}>
					<p className={styles.errorMsg}>{error}</p>
				</div>
			</div>
		)
	}

	if (loadingMatch || !analysis.selectedGame) {
		return (
			<div className={styles.page}>
				<div className={styles.loadingSpinner}>
					<span className={styles.spinnerIcon}>♟</span>
					<p>{t('loading', 'Loading game analysis...')}</p>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.page}>
			<div className={styles.breadcrumb}>
				<button className={styles.backBtn} onClick={handleBack}>
					← {t('back_to_games', 'Back to Games')}
				</button>
			</div>

			<GameAnalysis
				username={targetUsername || analysis.selectedGame.white?.username || 'White'}
				analysis={analysis}
				history={history}
				onBack={handleBack}
			/>
		</div>
	)
}
