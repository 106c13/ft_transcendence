import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { MatchRecord, GameAnalysisResult, MoveAnalysis } from '../components/GameAnalysis/GameAnalysis'

export function useGameAnalysis() {
	const [selectedGame, setSelectedGame] = useState<MatchRecord | null>(null)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [analysisData, setAnalysisData] = useState<GameAnalysisResult | null>(null)
	const [currentPly, setCurrentPly] = useState<number>(-1)
	const [showBestMoveHint, setShowBestMoveHint] = useState<boolean>(true)

	const moveListRef = useRef<HTMLDivElement>(null)

	const selectGame = useCallback(async (match: MatchRecord) => {
		setSelectedGame(match)
		setCurrentPly(-1)
		setShowBestMoveHint(true)

		if (match.analysis) {
			setAnalysisData(match.analysis)
			setIsAnalyzing(false)
			return
		}

		setIsAnalyzing(true)
		setAnalysisData(null)

		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`/api/game/analyze/${match.id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (res.ok) {
				const data: GameAnalysisResult = await res.json()
				setAnalysisData(data)
				match.analysis = data
			} else {
				console.error('Analysis request failed')
			}
		} catch (err) {
			console.error('Error starting analysis:', err)
		} finally {
			setIsAnalyzing(false)
		}
	}, [])

	const closeAnalysis = useCallback(() => {
		setSelectedGame(null)
		setAnalysisData(null)
	}, [])

	const goToPly = useCallback((ply: number) => {
		setCurrentPly(ply)
	}, [])

	const toggleBestMove = useCallback(() => {
		setShowBestMoveHint(prev => !prev)
	}, [])

	// Keyboard navigation
	useEffect(() => {
		if (!selectedGame || !analysisData) return

		const handleKeyDown = (e: KeyboardEvent) => {
			const totalPlies = analysisData.positions.length
			if (e.key === 'ArrowLeft') {
				e.preventDefault()
				setCurrentPly(p => Math.max(-1, p - 1))
			} else if (e.key === 'ArrowRight') {
				e.preventDefault()
				setCurrentPly(p => Math.min(totalPlies - 1, p + 1))
			} else if (e.key === 'ArrowDown') {
				e.preventDefault()
				setCurrentPly(-1)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setCurrentPly(totalPlies - 1)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [selectedGame, analysisData])

	// Scroll active move into view
	useEffect(() => {
		if (moveListRef.current) {
			const activeCell = moveListRef.current.querySelector('[data-active="true"]')
			if (activeCell) {
				activeCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
			}
		}
	}, [currentPly])

	// Derived state
	const currentPosition: MoveAnalysis | null = useMemo(() => {
		if (!analysisData || currentPly === -1 || !analysisData.positions[currentPly]) {
			return null
		}
		return analysisData.positions[currentPly]
	}, [analysisData, currentPly])

	const displayFen = useMemo(() => {
		if (currentPly === -1 || !currentPosition) {
			return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
		}
		return currentPosition.fenAfter
	}, [currentPly, currentPosition])

	const displayChess = useMemo(() => {
		return new Chess(displayFen)
	}, [displayFen])

	const evalInfo = useMemo(() => {
		if (!currentPosition) {
			return {
				winChanceWhite: 50,
				winChanceBlack: 50,
				scoreText: '0.0',
				isWhiteAdvantage: true,
			}
		}

		const winChanceWhite = currentPosition.winChance
		const winChanceBlack = Math.round((100 - winChanceWhite) * 10) / 10

		let scoreText = '0.0'
		if (currentPosition.mate !== null) {
			scoreText = `M${Math.abs(currentPosition.mate)}`
		} else {
			const pawns = currentPosition.score / 100
			scoreText = pawns > 0 ? `+${pawns.toFixed(1)}` : `${pawns.toFixed(1)}`
		}

		return {
			winChanceWhite,
			winChanceBlack,
			scoreText,
			isWhiteAdvantage: currentPosition.score >= 0,
		}
	}, [currentPosition])

	const isSuboptimalMove = currentPosition && ['inaccuracy', 'mistake', 'blunder'].includes(currentPosition.classification)

	const getClassificationBadge = (classification: string) => {
		switch (classification) {
			case 'brilliant':
				return { label: 'Brilliant', icon: '💎', colorClass: 'brilliant' }
			case 'great':
				return { label: 'Great Move', icon: '!', colorClass: 'great' }
			case 'best':
				return { label: 'Best', icon: '⭐', colorClass: 'best' }
			case 'excellent':
				return { label: 'Excellent', icon: '🟢', colorClass: 'excellent' }
			case 'good':
				return { label: 'Good', icon: '🔵', colorClass: 'good' }
			case 'inaccuracy':
				return { label: 'Inaccuracy', icon: '🟡', colorClass: 'inaccuracy' }
			case 'mistake':
				return { label: 'Mistake', icon: '🟠', colorClass: 'mistake' }
			case 'blunder':
				return { label: 'Blunder', icon: '🔴', colorClass: 'blunder' }
			default:
				return { label: classification, icon: '♟', colorClass: 'default' }
		}
	}

	return {
		selectedGame,
		isAnalyzing,
		analysisData,
		currentPly,
		showBestMoveHint,
		moveListRef,
		currentPosition,
		displayFen,
		displayChess,
		evalInfo,
		isSuboptimalMove,
		selectGame,
		closeAnalysis,
		goToPly,
		toggleBestMove,
		getClassificationBadge,
	}
}
