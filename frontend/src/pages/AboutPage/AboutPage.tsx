import { useState, useEffect, useMemo } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { MOVE_STEPS } from '../../utils/aboutUtils'
import type { DevKey } from '../../utils/aboutUtils'
import AboutHero from '../../components/AboutHero/AboutHero'
import AboutShowcase from '../../components/AboutShowcase/AboutShowcase'
import AboutMoveLog from '../../components/AboutMoveLog/AboutMoveLog'
import AboutBoard from '../../components/AboutBoard/AboutBoard'
import AboutContributors from '../../components/AboutContributors/AboutContributors'
import AboutCurriculum from '../../components/AboutCurriculum/AboutCurriculum'
import styles from './AboutPage.module.css'

export default function AboutPage() {
	usePageTitle('page_title_about')

	const [currentPly, setCurrentPly] = useState(0)
	const [isPlaying, setIsPlaying] = useState(false)
	const [selectedDev, setSelectedDev] = useState<DevKey | null>('arman')
	const [isPieceSelected, setIsPieceSelected] = useState(true)

	const maxPly = MOVE_STEPS.length - 1

	// Keyboard shortcuts: Space for play/pause, Arrow keys for move navigation (like game page)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null
			if (
				target &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.isContentEditable)
			) {
				return
			}

			if (e.code === 'Space' || e.key === ' ') {
				e.preventDefault()
				setIsPlaying((prev) => !prev)
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault()
				setCurrentPly((prev) => Math.max(0, prev - 1))
			} else if (e.key === 'ArrowRight') {
				e.preventDefault()
				setCurrentPly((prev) => Math.min(maxPly, prev + 1))
			} else if (e.key === 'ArrowDown') {
				e.preventDefault()
				setCurrentPly(0)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setCurrentPly(maxPly)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [maxPly])

	// Close description card when clicking anywhere on the page outside pieces and cards
	useEffect(() => {
		if (!selectedDev) return

		const handleDocumentClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null
			if (!target) return

			// Keep open if clicking a piece on the board, within the showcase, or on a contributor card
			if (
				target.closest('[data-about-piece]') ||
				target.closest('[data-about-showcase]') ||
				target.closest('[data-about-contributor-card]')
			) {
				return
			}

			setSelectedDev(null)
			setIsPieceSelected(false)
		}

		const timer = setTimeout(() => {
			document.addEventListener('click', handleDocumentClick)
		}, 0)

		return () => {
			clearTimeout(timer)
			document.removeEventListener('click', handleDocumentClick)
		}
	}, [selectedDev])

	// Autoplay loop: only advances when isPlaying is explicitly true
	useEffect(() => {
		if (!isPlaying) return

		const isLastPly = currentPly === maxPly
		// Wait 3.5s after checkmate before looping back, or 1.3s between moves
		const delay = isLastPly ? 3500 : 1300

		const timer = setTimeout(() => {
			setCurrentPly((prev) => (prev >= maxPly ? 0 : prev + 1))
		}, delay)

		return () => clearTimeout(timer)
	}, [isPlaying, currentPly, maxPly])

	// Current move step
	const currentStep = MOVE_STEPS[currentPly]

	// Move selection via log or buttons
	const handleSelectPly = (ply: number) => {
		setCurrentPly(ply)
	}

	// Toggle play/pause button
	const handleTogglePlay = () => {
		setIsPlaying((prev) => !prev)
	}

	// User clicks a piece on the board: highlights piece and pauses autoplay
	const handleSelectDevFromBoard = (dev: DevKey) => {
		setSelectedDev(dev)
		setIsPieceSelected(true)
		setIsPlaying(false)
	}

	// User clicks elsewhere on the board: clears piece selection and closes description
	const handleClickEmptyBoard = () => {
		setIsPieceSelected(false)
		setSelectedDev(null)
	}

	// User clicks a contributor card at the bottom: opens description
	const handleSelectDevFromCard = (dev: DevKey) => {
		setSelectedDev(dev)
	}

	// Compute selected developer's current square at current ply
	const currentSquare = useMemo(() => {
		if (selectedDev === 'arman') return currentPly >= 1 ? 'd1' : 'c1'
		if (selectedDev === 'narek') return currentPly >= 5 ? 'g2' : 'c2'
		if (selectedDev === 'hakob') return currentPly >= 3 ? 'e3' : 'd5'
		return undefined
	}, [selectedDev, currentPly])

	const isShowcaseOpen = selectedDev !== null

	return (
		<div className={styles.aboutContainer}>
			<div className={styles.content}>
				{/* Top Hero Section */}
				<AboutHero />

				{/* Interactive Section: Equal 14px margins, matching widths, smooth expand */}
				<section
					className={`${styles.interactiveSection} ${
						isShowcaseOpen ? styles.open : styles.closed
					}`}
				>
					{/* Left: Expanding Description Showcase */}
					<div
						className={`${styles.showcaseWrapper} ${
							isShowcaseOpen ? styles.open : ''
						}`}
					>
						<AboutShowcase
							selectedDev={selectedDev}
							currentSquare={currentSquare}
						/>
					</div>

					{/* Center: The 8x8 Chessboard */}
					<div className={styles.boardColumn}>
						<AboutBoard
							fen={currentStep.fen}
							isCheckmate={Boolean(currentStep.isCheckmate)}
							selectedDev={isPieceSelected ? selectedDev : null}
							onSelectDev={handleSelectDevFromBoard}
							onClickEmpty={handleClickEmptyBoard}
						/>
					</div>

					{/* Right: Vertical Move Log (Exact same 280px width) */}
					<div className={styles.rightColumn}>
						<AboutMoveLog
							currentPly={currentPly}
							onSelectPly={handleSelectPly}
							isPlaying={isPlaying}
							onTogglePlay={handleTogglePlay}
						/>
					</div>
				</section>

				{/* Contributors Responsibilities Cards */}
				<AboutContributors
					selectedDev={selectedDev}
					onSelectDev={handleSelectDevFromCard}
				/>

				{/* 42 Curriculum & Architecture Summary */}
				<AboutCurriculum />
			</div>
		</div>
	)
}
