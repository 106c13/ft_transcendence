import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGameHistory } from '../../hooks/useGameHistory'
import { useRatingHistory, type RatingCategory } from '../../hooks/useRatingHistory'
import type { User } from '../../constants/profileConstants'
import BigRatingChart from '../../components/BigRatingChart/BigRatingChart'
import CustomSelect, { type SelectOption } from '../../components/CustomSelect/CustomSelect'
import styles from './RatingHistoryPage.module.css'

const VALID_MODES: RatingCategory[] = ['bullet', 'blitz', 'rapid']

export default function RatingHistoryPage() {
	const { t } = useTranslation()
	const { username: paramUsername } = useParams()
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	const rawMode = searchParams.get('mode') as RatingCategory
	const selectedMode: RatingCategory = VALID_MODES.includes(rawMode) ? rawMode : 'blitz'

	const [user, setUser] = useState<User | null>(null)
	const [loadingUser, setLoadingUser] = useState(true)

	// Fetch user details
	useEffect(() => {
		const fetchUser = async () => {
			setLoadingUser(true)
			try {
				const token = localStorage.getItem('token')
				const endpoint = paramUsername ? `/api/users/${paramUsername}` : '/api/users/me'
				const res = await fetch(endpoint, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				})

				if (res.ok) {
					const data = await res.json()
					setUser(data)
				}
			} catch (err) {
				console.error('Failed to load user for rating history:', err)
			} finally {
				setLoadingUser(false)
			}
		}

		fetchUser()
	}, [paramUsername])

	const actualUsername = user?.username || paramUsername || ''
	const gameHistory = useGameHistory(actualUsername)
	const ratingData = useRatingHistory(gameHistory.matches, actualUsername, user?.ratings)

	const handleModeChange = (newMode: RatingCategory) => {
		setSearchParams({ mode: newMode })
	}

	const handleBack = () => {
		if (paramUsername) {
			navigate(`/profile/${paramUsername}`)
		} else {
			navigate('/profile')
		}
	}

	if (loadingUser && !user) {
		return (
			<div className={styles.pageContainer}>
				<div className={styles.loadingSpinner}>
					<span className={styles.spinnerIcon}>📈</span>
					<p>{t('loading', 'Loading rating history...')}</p>
				</div>
			</div>
		)
	}

	const currentModeHistory = ratingData[selectedMode]

	const modeOptions: SelectOption<RatingCategory>[] = [
		{ value: 'bullet', icon: '🔥', label: `${t('bullet_rating', 'Bullet')} (1 min)` },
		{ value: 'blitz', icon: '⚡', label: `${t('blitz_rating', 'Blitz')} (3 min)` },
		{ value: 'rapid', icon: '⏳', label: `${t('rapid_rating', 'Rapid')} (10 min)` },
	]

	return (
		<div className={styles.pageContainer}>
			{/* Top bar with back button & game mode dropdown */}
			<div className={styles.topBar}>
				<button className={styles.backBtn} onClick={handleBack}>
					← {t('back_to_profile', 'Back to Profile')}
				</button>

				<div className={styles.modeSelectorGroup}>
					<label className={styles.modeLabel}>
						{t('filter_mode', 'Game Mode')}:
					</label>
					<CustomSelect<RatingCategory>
						value={selectedMode}
						options={modeOptions}
						onChange={handleModeChange}
						minWidth={165}
					/>
				</div>
			</div>

			{/* User header */}
			{user && (
				<div className={styles.userHeader}>
					<img
						src={user.avatar ? `/uploads/${user.avatar}` : '/assets/default.jpg'}
						alt={user.username}
						className={styles.avatar}
					/>
					<div className={styles.userInfo}>
						<span className={styles.userName}>{user.username}</span>
						<span className={styles.userSubtitle}>
							{t('rating_overview', 'Rating Overview & Progression')}
						</span>
					</div>
				</div>
			)}

			{/* Main Big Rating Chart */}
			<BigRatingChart mode={selectedMode} history={currentModeHistory} />
		</div>
	)
}

