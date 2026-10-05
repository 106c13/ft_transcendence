import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { RatingInfo } from '../../constants/profileConstants'
import { getAvatarUrl, getModeColor, getPieceImageSrc } from '../../constants/gameConstants'
import styles from './PlayerBanner.module.css'

type PieceCapture = { type: string; color: 'w' | 'b' }

type Props = {
	name: string
	username?: string
	avatar?: string | null
	color: 'w' | 'b'
	time: number
	isActive: boolean
	isBottom?: boolean
	rating?: number | null
	ratingDelta?: number | null
	isGameOver?: boolean
	isProvisional?: boolean
	initialRatings?: Record<string, RatingInfo | null> | null
	selectedMode?: string
	capturedPieces?: PieceCapture[]
	materialDiff?: number
}

export function formatTime(timeMs: number) {
	const totalSecs = Math.floor(timeMs / 1000)
	const mins = Math.floor(totalSecs / 60)
	const secs = totalSecs % 60
	const tenths = Math.floor((timeMs % 1000) / 100)

	const minStr = mins.toString().padStart(2, '0')
	const secStr = secs.toString().padStart(2, '0')

	if (timeMs < 10000) {
		return `${mins}:${secStr}.${tenths}`
	}
	return `${minStr}:${secStr}`
}

function PlayerBanner({
	name,
	username,
	avatar,
	color: _color,
	time,
	isActive,
	isBottom = false,
	rating,
	ratingDelta,
	isGameOver = false,
	isProvisional,
	initialRatings,
	selectedMode = 'blitz',
	capturedPieces,
	materialDiff,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [isOpen, setIsOpen] = useState(false)
	const [ratings, setRatings] = useState<Record<string, RatingInfo | null> | null>(initialRatings || null)
	const [userAvatar, setUserAvatar] = useState<string | null>(avatar || null)
	const [isLoadingDetails, setIsLoadingDetails] = useState(false)
	const wrapperRef = useRef<HTMLDivElement>(null)

	const actualUsername = username || name
	const modeColor = getModeColor(selectedMode)

	const canViewProfile = Boolean(
		actualUsername &&
		actualUsername !== 'Opponent' &&
		actualUsername !== t('opponent', 'Opponent') &&
		actualUsername !== 'AI'
	)

	const handleSeeProfile = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsOpen(false)
		if (canViewProfile) {
			if (actualUsername === 'You' || actualUsername === t('you')) {
				navigate('/profile')
			} else {
				navigate(`/profile/${actualUsername}`)
			}
		}
	}

	// Update local state when props change
	useEffect(() => {
		if (initialRatings) {
			setRatings(initialRatings)
		}
	}, [initialRatings])

	useEffect(() => {
		if (avatar !== undefined) {
			setUserAvatar(avatar)
		}
	}, [avatar])

	// Fetch ratings and avatar from backend on open if missing
	useEffect(() => {
		if (isOpen && actualUsername && (!ratings || !userAvatar) && actualUsername !== 'Opponent' && actualUsername !== 'You') {
			setIsLoadingDetails(true)
			const token = localStorage.getItem('token')
			fetch(`/api/users/${actualUsername}`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			})
				.then(res => res.ok ? res.json() : null)
				.then(data => {
					if (data) {
						if (data.ratings) setRatings(data.ratings)
						if (data.avatar) setUserAvatar(data.avatar)
					}
				})
				.catch(err => console.error('Failed to load user info:', err))
				.finally(() => setIsLoadingDetails(false))
		}
	}, [isOpen, actualUsername, ratings, userAvatar])

	// Close on outside click or Escape
	useEffect(() => {
		if (!isOpen) return
		const handleClickOutside = (e: MouseEvent) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	const isLowTime = isActive && time <= 10000

	const getDisplayRating = (mode: 'bullet' | 'blitz' | 'rapid') => {
		const info = ratings?.[mode]
		if (info) {
			return info.isProvisional ? `~${info.rating}` : `${info.rating}`
		}
		if (mode === selectedMode && rating !== undefined && rating !== null) {
			return isProvisional ? `~${rating}` : `${rating}`
		}
		if (isLoadingDetails) {
			return '···'
		}
		return '—'
	}

	return (
		<div
			className={`${styles.bannerSlot} ${isBottom ? styles.slotBottom : styles.slotTop} ${isOpen ? styles.slotOpen : ''}`}
		>
			<div
				className={`${styles.bannerBar} ${
					isActive ? styles.activeTurn : ''
				} ${isLowTime ? styles.lowTime : ''}`}
			>
				{/* Left Group: User info + Captured pieces right beside it */}
				<div className={styles.leftGroup}>
					<div className={styles.userInfoAnchor} ref={wrapperRef}>
						{/* User row: click avatar or name to toggle minimalistic ratings popup */}
						<div
							className={`${styles.userMainRow} ${isOpen ? styles.userMainRowActive : ''}`}
							onClick={() => setIsOpen(prev => !prev)}
							role="button"
							tabIndex={0}
							onKeyDown={e => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									setIsOpen(prev => !prev)
								}
							}}
							title={isOpen ? t('click_to_collapse', 'Click to collapse') : t('click_to_view_ratings', 'Click to view player ratings')}
						>
							<img
								src={getAvatarUrl(userAvatar)}
								alt={name}
								className={styles.profilePic}
								onError={e => {
									const target = e.currentTarget
									if (!target.src.endsWith('/assets/default.jpg')) {
										target.src = '/assets/default.jpg'
									}
								}}
							/>
							<div className={styles.playerTextStack}>
								<span className={styles.nickname}>{name}</span>
								<div className={styles.ratingRow}>
									{rating !== undefined && rating !== null && (
										<span
											className={styles.ratingText}
											style={{ color: modeColor }}
										>
											{isProvisional ? `~${rating}` : rating}
										</span>
									)}
									{isGameOver && ratingDelta !== undefined && ratingDelta !== null && (
										<span
											className={`${styles.ratingDeltaBadge} ${
												ratingDelta > 0
													? styles.deltaPositive
													: ratingDelta < 0
													? styles.deltaNegative
													: styles.deltaNeutral
											}`}
										>
											{ratingDelta > 0 ? `↑${ratingDelta}` : ratingDelta < 0 ? `↓${Math.abs(ratingDelta)}` : '0'}
										</span>
									)}
								</div>
							</div>

							{/* Minimalistic Ratings Popup */}
							{isOpen && (
								<div
									className={`${styles.ratingPopup} ${isBottom ? styles.popupAbove : styles.popupBelow}`}
									onClick={e => e.stopPropagation()}
									role="dialog"
									aria-label={t('player_ratings', 'Player Ratings')}
								>
									<div className={styles.ratingPopupGrid}>
										<div className={`${styles.ratingPopupItem} ${selectedMode === 'bullet' ? styles.ratingItemActive : ''}`}>
											<div className={styles.ratingPopupHeader}>
												<span className={styles.ratingPopupIcon}>🔥</span>
												<span className={styles.ratingPopupMode}>{t('bullet_rating', 'Bullet')}</span>
											</div>
											<span className={styles.ratingPopupValue} style={{ color: getModeColor('bullet') }}>
												{getDisplayRating('bullet')}
											</span>
										</div>

										<div className={`${styles.ratingPopupItem} ${selectedMode === 'blitz' ? styles.ratingItemActive : ''}`}>
											<div className={styles.ratingPopupHeader}>
												<span className={styles.ratingPopupIcon}>⚡</span>
												<span className={styles.ratingPopupMode}>{t('blitz_rating', 'Blitz')}</span>
											</div>
											<span className={styles.ratingPopupValue} style={{ color: getModeColor('blitz') }}>
												{getDisplayRating('blitz')}
											</span>
										</div>

										<div className={`${styles.ratingPopupItem} ${selectedMode === 'rapid' ? styles.ratingItemActive : ''}`}>
											<div className={styles.ratingPopupHeader}>
												<span className={styles.ratingPopupIcon}>⏳</span>
												<span className={styles.ratingPopupMode}>{t('rapid_rating', 'Rapid')}</span>
											</div>
											<span className={styles.ratingPopupValue} style={{ color: getModeColor('rapid') }}>
												{getDisplayRating('rapid')}
											</span>
										</div>
									</div>

									{canViewProfile && (
										<div className={styles.ratingPopupFooter}>
											<button
												type="button"
												className={styles.seeProfileBtn}
												onClick={handleSeeProfile}
											>
												{t('see_profile', 'See profile')} →
											</button>
										</div>
									)}

									{/* Pointer pointing at the center of the user row */}
									<div className={isBottom ? styles.pointerDown : styles.pointerUp} />
								</div>
							)}
						</div>
					</div>

					{/* Captured Pieces: right beside user info */}
					{capturedPieces && capturedPieces.length > 0 && (
						<div className={styles.capturedArea}>
							<div className={styles.capturedList}>
								{capturedPieces.map((p, idx) => (
									<img
										key={idx}
										src={getPieceImageSrc(p.type, p.color)}
										alt={p.type}
										className={styles.capturedPiece}
									/>
								))}
							</div>
							{materialDiff !== undefined && materialDiff > 0 && (
								<span className={styles.materialDiff}>+{materialDiff}</span>
							)}
						</div>
					)}
				</div>

				{/* Clock */}
				<div className={styles.gameClock}>{formatTime(time)}</div>
			</div>
		</div>
	)
}

export default PlayerBanner