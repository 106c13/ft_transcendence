import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { downloadPgn, type MatchRecord } from '../utils/gameUtils';

export function useGameHistory(username: string) {
	const { t, i18n } = useTranslation();
	const locale = i18n.resolvedLanguage || i18n.language || 'en';
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
			} catch {
				// Leave history empty on failure
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
			return { label: t('draw'), className: 'draw' }
		}

		const userWon =
			(isUserWhite && match.winner_id === match.white_id) ||
			(isUserBlack && match.winner_id === match.black_id)

		if (userWon) {
			return { label: t('victory'), className: 'win' }
		} else {
			return { label: t('defeat'), className: 'loss' }
		}
	}

	const formatDate = (dateStr: string) => {
		try {
			const d = new Date(dateStr)
			return d.toLocaleDateString(locale, {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			return dateStr
		}
	}

	const formatReason = (reason: string) => {
		switch (reason) {
			case 'CHECKMATE':
				return t('reason_checkmate')
			case 'STALEMATE':
				return t('reason_stalemate')
			case 'TIMEOUT':
				return t('reason_timeout')
			case 'RESIGNATION':
				return t('reason_resignation')
			case 'DISCONNECTION':
				return t('reason_disconnection')
			case 'DRAW':
			case 'INSUFFICIENT_MATERIAL':
			case 'THREEFOLD_REPETITION':
				return t('reason_draw')
			default:
				return reason
		}
	}

	const handleDownloadPgn = (match: MatchRecord) => {
		downloadPgn(match);
	};

	return {
		matches,
		loading,
		getOutcome,
		formatDate,
		formatReason,
		handleDownloadPgn,
	}
}
