import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RatingInfo } from '../../utils/profileUtils';
import { getAvatarUrl, getModeColor, getPieceImageSrc } from '../../utils/gameUtils';
import { WifiOff } from 'lucide-react';
import styles from './PlayerBanner.module.css';


type PieceCapture = { type: string; color: 'w' | 'b' }

type Props = {
	name: string
	username?: string
	avatar?: string | null
	color: 'w' | 'b'
	time: number
	isActive: boolean
	isBottom?: boolean
	rating?: number | string | null
	ratingDelta?: number | null
	isGameOver?: boolean
	isProvisional?: boolean
	initialRatings?: Record<string, RatingInfo | null> | null
	selectedMode?: string
	capturedPieces?: PieceCapture[]
	materialDiff?: number
	hideClock?: boolean
	isDisconnected?: boolean
	disconnectCountdown?: number | null
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

const PlayerBanner = ({
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
	hideClock = false,
	isDisconnected = false,
	disconnectCountdown = null,
}: Props) => {
	const { t } = useTranslation();
	const [userAvatar, setUserAvatar] = useState<string | null>(avatar || null)

	const actualUsername = username || name
	const modeColor = getModeColor(selectedMode)
	const shouldHideClock = hideClock || isGameOver

	const isAnonymousPlaceholder = !actualUsername ||
		['White', 'Black', 'Opponent', 'AI', 'Anonymous', '?', 'You'].includes(actualUsername) ||
		actualUsername === t('opponent') ||
		actualUsername === t('you');

	const [userExists, setUserExists] = useState<boolean>(() => {
		if (initialRatings) return true
		if (isAnonymousPlaceholder) return false
		return false
	})

	const canViewProfile = Boolean(
		userExists &&
		actualUsername &&
		!isAnonymousPlaceholder
	)

	const handleOpenProfile = () => {
		if (!canViewProfile) return
		window.open(`/profile/${encodeURIComponent(actualUsername)}`, '_blank', 'noopener,noreferrer')
	}

	useEffect(() => {
		if (initialRatings) {
			setUserExists(true)
		}
	}, [initialRatings])

	useEffect(() => {
		if (avatar !== undefined) {
			setUserAvatar(avatar)
		}
	}, [avatar])

	// Check if user exists in our DB and fetch avatar if not supplied
	useEffect(() => {
		if (initialRatings) {
			setUserExists(true)
			return
		}
		if (isAnonymousPlaceholder) {
			setUserExists(false)
			return
		}

		let isSubscribed = true
		const token = localStorage.getItem('token')
		fetch(`/api/users/${encodeURIComponent(actualUsername)}`, {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		})
			.then(res => {
				if (!isSubscribed) return null
				if (res.ok) {
					setUserExists(true)
					return res.json()
				} else {
					setUserExists(false)
					return null
				}
			})
			.then(data => {
				if (!isSubscribed || !data) return
				if (data.avatar) setUserAvatar(data.avatar)
			})
			.catch(() => {
				if (isSubscribed) {
					setUserExists(false)
				}
			})

		return () => {
			isSubscribed = false
		}
	}, [actualUsername, initialRatings, isAnonymousPlaceholder])

	const isLowTime = isActive && time <= 10000

	return (
		<div
			className={`${styles.bannerSlot} ${isBottom ? styles.slotBottom : styles.slotTop}`}
		>
			<div
				className={`${styles.bannerBar} ${
					isActive ? styles.activeTurn : ''
				} ${isLowTime ? styles.lowTime : ''}`}
			>
				{/* Left Group: User info + Captured pieces right beside it */}
				<div className={styles.leftGroup}>
					<div className={styles.userInfoAnchor}>
						{/* User row: click avatar or name to open player profile in a new tab if user exists */}
						<div
							className={`${styles.userMainRow} ${
								canViewProfile ? styles.userMainRowClickable : styles.userMainRowDisabled
							}`}
							onClick={handleOpenProfile}
							role={canViewProfile ? 'button' : undefined}
							tabIndex={canViewProfile ? 0 : -1}
							onKeyDown={e => {
								if (canViewProfile && (e.key === 'Enter' || e.key === ' ')) {
									e.preventDefault()
									handleOpenProfile()
								}
							}}
							title={canViewProfile ? t('see_profile') : undefined}
						>
							{isDisconnected ? (
								<div className={styles.disconnectedProfilePic} aria-label={t('opponent_disconnected_title')}>
									<WifiOff size={20} strokeWidth={2.25} aria-hidden="true" />
								</div>
							) : (
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
							)}
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
						</div>
					</div>

					{/* Captured pieces and connection status */}
					{isDisconnected ? (
						<span className={styles.disconnectStatus}>
							{t('opponent_reconnect_wait')} {disconnectCountdown ?? 0}s
						</span>
					) : (
						<div className={styles.capturedArea}>
							<div className={styles.capturedRow}>
								<div className={styles.capturedList}>
									{capturedPieces?.map((p, idx) => (
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
						</div>
					)}
				</div>

				{/* Clock */}
				<div
					className={`${styles.clockWrapper} ${shouldHideClock ? styles.clockHidden : ''}`}
					aria-hidden={shouldHideClock}
				>
					<div className={styles.gameClock}>{formatTime(time)}</div>
				</div>
			</div>
		</div>
	);
};

export default PlayerBanner;