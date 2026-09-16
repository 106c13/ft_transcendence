import { useMemo } from 'react'
import type { MatchRecord } from '../components/GameAnalysis/GameAnalysis'
import type { User, RatingInfo } from '../constants/profileConstants'

export type RatingCategory = 'bullet' | 'blitz' | 'rapid'

export type SparklinePoint = {
	date: string
	label: string
	rating: number
}

export type AllTimeRatingPoint = {
	id: string | number
	date: string
	displayDate: string
	rating: number
	delta: number | null
	result?: 'win' | 'loss' | 'draw'
	opponent?: string
	mode: string
}

export type ModeRatingHistory = {
	current: number
	peak: number
	lowest: number
	gamesPlayed: number
	wins: number
	losses: number
	draws: number
	winRate: number
	isProvisional: boolean
	delta7Days: number
	last7Days: SparklinePoint[]
	allTime: AllTimeRatingPoint[]
}

export function useRatingHistory(
	matches: MatchRecord[],
	username: string,
	ratings?: User['ratings']
) {
	return useMemo(() => {
		const categories: RatingCategory[] = ['bullet', 'blitz', 'rapid']
		const result: Record<RatingCategory, ModeRatingHistory> = {} as any

		for (const cat of categories) {
			const catRatingInfo: RatingInfo | null = ratings ? ratings[cat] : null
			const currentRating = catRatingInfo?.rating ?? 800
			const isProvisional = catRatingInfo?.isProvisional ?? true
			const gamesPlayed = catRatingInfo?.gamesPlayed ?? 0
			const wins = catRatingInfo?.wins ?? 0
			const losses = catRatingInfo?.losses ?? 0
			const draws = catRatingInfo?.draws ?? 0
			const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0

			// Filter matches belonging to this category (e.g. 'bullet' and 'bullet+2')
			const catMatches = matches
				.filter(m => m.mode.replace('+2', '') === cat)
				.sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())

			// Build all-time timeline
			const allTime: AllTimeRatingPoint[] = []
			let peak = currentRating
			let lowest = currentRating

			if (catMatches.length > 0) {
				for (const m of catMatches) {
					const isWhite = m.white?.username === username
					const ratingAfter = isWhite ? m.white_rating_after : m.black_rating_after
					const delta = isWhite ? m.white_rating_delta : m.black_rating_delta
					const opponent = isWhite ? (m.black?.username || 'Opponent') : (m.white?.username || 'Opponent')

					let outcome: 'win' | 'loss' | 'draw' = 'draw'
					if (m.winner_id) {
						outcome = (isWhite && m.winner_id === m.white_id) || (!isWhite && m.winner_id === m.black_id)
							? 'win'
							: 'loss'
					}

					if (ratingAfter !== null && ratingAfter !== undefined) {
						const dateObj = new Date(m.played_at)
						allTime.push({
							id: m.id,
							date: m.played_at,
							displayDate: dateObj.toLocaleDateString(undefined, {
								month: 'short',
								day: 'numeric',
							}),
							rating: ratingAfter,
							delta: delta ?? null,
							result: outcome,
							opponent,
							mode: m.mode,
						})

						if (ratingAfter > peak) peak = ratingAfter
						if (ratingAfter < lowest) lowest = ratingAfter
					}
				}
			}

			// If no match ratings recorded yet, show a starting point
			if (allTime.length === 0) {
				allTime.push({
					id: 'init',
					date: new Date().toISOString(),
					displayDate: 'Initial',
					rating: currentRating,
					delta: 0,
					mode: cat,
				})
			}

			// Generate 7-day sparkline points
			const now = new Date()
			const last7Days: SparklinePoint[] = []

			// We need points for Day -6, Day -5, ..., Day 0 (today)
			for (let i = 6; i >= 0; i--) {
				const targetDate = new Date(now)
				targetDate.setDate(targetDate.getDate() - i)
				targetDate.setHours(23, 59, 59, 999)
				const targetTimestamp = targetDate.getTime()

				// Find the latest rating on or before this day's end
				let ratingOnDay = currentRating
				const matchesBeforeDay = allTime.filter(p => new Date(p.date).getTime() <= targetTimestamp)

				if (matchesBeforeDay.length > 0) {
					ratingOnDay = matchesBeforeDay[matchesBeforeDay.length - 1].rating
				} else if (allTime.length > 0) {
					// Fall back to the earliest recorded rating
					ratingOnDay = allTime[0].rating
				}

				last7Days.push({
					date: targetDate.toISOString(),
					label: targetDate.toLocaleDateString(undefined, { weekday: 'narrow' }),
					rating: ratingOnDay,
				})
			}

			const delta7Days = last7Days[last7Days.length - 1].rating - last7Days[0].rating

			result[cat] = {
				current: currentRating,
				peak,
				lowest,
				gamesPlayed,
				wins,
				losses,
				draws,
				winRate,
				isProvisional,
				delta7Days,
				last7Days,
				allTime,
			}
		}

		return result
	}, [matches, username, ratings])
}

