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

	if (timeMs < 15000) {
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

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return
		const handleClickOutside = (e: MouseEvent) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isOpen])

	const isLowTime = isActive && time < 15000

	const bulletInfo = ratings?.bullet
	const blitzInfo = ratings?.blitz
	const rapidInfo = ratings?.rapid

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
						{/* In-flow stationary user row */}
						<div
							className={styles.userMainRow}
							onClick={() => setIsOpen(prev => !prev)}
							role="button"
							tabIndex={0}
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
								{rating !== undefined && rating !== null && (
									<span
										className={styles.ratingText}
										style={{ color: modeColor }}
									>
										{isProvisional ? `~${rating}` : rating}
									</span>
								)}
							</div>
						</div>

						{/* Expanded Modal Card: Mounted strictly when isOpen */}
						{isOpen && (
							<div
								className={`${styles.modalCard} ${isBottom ? styles.modalBottom : styles.modalTop}`}
								onClick={e => e.stopPropagation()}
							>
								{/* Modal Header: matches exact avatar/nick/rating position + actions */}
								<div className={styles.modalHeaderRow}>
									<div
										className={styles.modalUserMeta}
										onClick={() => setIsOpen(false)}
										role="button"
										tabIndex={0}
										title={t('click_to_collapse', 'Click to collapse')}
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
											{rating !== undefined && rating !== null && (
												<span
													className={styles.ratingText}
													style={{ color: modeColor }}
												>
													{isProvisional ? `~${rating}` : rating}
												</span>
											)}
										</div>
									</div>

									<div className={styles.modalActions}>
										{actualUsername && actualUsername !== 'Opponent' && (
											<button
												type="button"
												className={styles.seeProfileBtn}
												onClick={e => {
													e.stopPropagation()
													setIsOpen(false)
													navigate(`/profile/${actualUsername}`)
												}}
											>
												{t('see_profile', 'See profile')}
											</button>
										)}
										<button
											type="button"
											className={styles.closeBtn}
											onClick={e => {
												e.stopPropagation()
												setIsOpen(false)
											}}
											aria-label="Close"
										>
											✕
										</button>
									</div>
								</div>

								{/* Ratings Grid */}
								<div className={styles.modalRatingsSection}>
									<div className={styles.ratingsHorizontalGrid}>
										<div className={styles.ratingCard}>
											<div className={styles.ratingCardHeader}>
												<span className={styles.modeIcon}>🔥</span>
												<span className={styles.modeName}>{t('bullet_rating', 'Bullet')}</span>
											</div>
											<span className={styles.modeRating}>
												{bulletInfo
													? bulletInfo.isProvisional
														? `~${bulletInfo.rating}`
														: bulletInfo.rating
													: (rating && !isLoadingDetails ? `~${rating}` : '—')}
											</span>
										</div>

										<div className={styles.ratingCard}>
											<div className={styles.ratingCardHeader}>
												<span className={styles.modeIcon}>⚡</span>
												<span className={styles.modeName}>{t('blitz_rating', 'Blitz')}</span>
											</div>
											<span className={styles.modeRating}>
												{blitzInfo
													? blitzInfo.isProvisional
														? `~${blitzInfo.rating}`
														: blitzInfo.rating
													: (rating && !isLoadingDetails ? `~${rating}` : '—')}
											</span>
										</div>

										<div className={styles.ratingCard}>
											<div className={styles.ratingCardHeader}>
												<span className={styles.modeIcon}>⏳</span>
												<span className={styles.modeName}>{t('rapid_rating', 'Rapid')}</span>
											</div>
											<span className={styles.modeRating}>
												{rapidInfo
													? rapidInfo.isProvisional
														? `~${rapidInfo.rating}`
														: rapidInfo.rating
													: (rating && !isLoadingDetails ? `~${rating}` : '—')}
											</span>
										</div>
									</div>
								</div>
							</div>
						)}
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