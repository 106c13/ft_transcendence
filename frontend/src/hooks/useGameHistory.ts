import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MatchRecord } from '../components/GameAnalysis/GameAnalysis'

export function useGameHistory(username: string) {
	const { t } = useTranslation()
	const [matches, setMatches] = useState<MatchRecord[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const loadMatches = async () => {
			setLoading(true)
			try {
				const token = localStorage.getItem('token')
				if (!token) return

				const res = await fetch(`/api/game/history/${username}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				if (res.ok) {
					const data = await res.json()
					setMatches(data)
				}
			} catch (err) {
				console.error('Failed to fetch game history:', err)
			} finally {
				setLoading(false)
			}
		}

		if (username) {
			loadMatches()
		}
	}, [username])

	const getOutcome = (match: MatchRecord) => {
		const isUserWhite = match.white?.username === username
		const isUserBlack = match.black?.username === username

		if (!match.winner_id) {
			return { label: t('draw', 'Draw'), className: 'draw' }
		}

		const userWon =
			(isUserWhite && match.winner_id === match.white_id) ||
			(isUserBlack && match.winner_id === match.black_id)

		if (userWon) {
			return { label: t('victory', 'Victory'), className: 'win' }
		} else {
			return { label: t('defeat', 'Defeat'), className: 'loss' }
		}
	}

	const formatDate = (dateStr: string) => {
		try {
			const d = new Date(dateStr)
			return d.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch {
			return dateStr
		}
	}

	const formatReason = (reason: string) => {
		switch (reason) {
			case 'CHECKMATE':
				return t('reason_checkmate', 'Checkmate')
			case 'STALEMATE':
				return t('reason_stalemate', 'Stalemate')
			case 'TIMEOUT':
				return t('reason_timeout', 'Time Out')
			case 'RESIGNATION':
				return t('reason_resignation', 'Resignation')
			case 'DISCONNECTION':
				return t('reason_disconnection', 'Disconnection')
			case 'DRAW':
			case 'INSUFFICIENT_MATERIAL':
			case 'THREEFOLD_REPETITION':
				return t('reason_draw', 'Draw')
			default:
				return reason
		}
	}

	const handleDownloadPgn = (match: MatchRecord) => {
		if (!match.pgn) return
		const whiteName = match.white?.username || 'White'
		const blackName = match.black?.username || 'Black'
		const dateStr = match.played_at ? new Date(match.played_at).toISOString().split('T')[0] : 'match'
		const filename = `${whiteName}_vs_${blackName}_${dateStr}.pgn`

		const blob = new Blob([match.pgn], { type: 'application/x-chess-pgn;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}

	return {
		matches,
		loading,
		getOutcome,
		formatDate,
		formatReason,
		handleDownloadPgn,
	}
}
