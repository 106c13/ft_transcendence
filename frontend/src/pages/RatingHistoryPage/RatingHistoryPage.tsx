import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { useGameHistory } from '../../hooks/useGameHistory';
import { useRatingHistory, type RatingCategory } from '../../hooks/useRatingHistory';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { User } from '../../utils/profileUtils';
import BigRatingChart from '../../components/BigRatingChart/BigRatingChart';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import GameModeIcon from '../../components/GameModeIcon/GameModeIcon';
import type { SelectOption } from '../../utils/selectUtils';
import styles from './RatingHistoryPage.module.css';

const VALID_MODES: RatingCategory[] = ['bullet', 'blitz', 'rapid'];

const RatingHistoryPage = () => {
	const { t } = useTranslation();
	usePageTitle('page_title_rating_history')
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
			<div className={styles.ratingHistoryPage}>
				<div className={styles.loadingSpinner}>
					<TrendingUp size={32} className={styles.spinnerIcon} aria-hidden="true" />
					<p>{t('loading')}</p>
				</div>
			</div>
		);
	}

	const currentModeHistory = ratingData[selectedMode];

	const modeOptions: SelectOption<RatingCategory>[] = [
		{ value: 'bullet', icon: <GameModeIcon mode="bullet" size={14} />, label: `${t('bullet_rating')} (${t('time_1_min')})` },
		{ value: 'blitz', icon: <GameModeIcon mode="blitz" size={14} />, label: `${t('blitz_rating')} (${t('time_3_min')})` },
		{ value: 'rapid', icon: <GameModeIcon mode="rapid" size={14} />, label: `${t('rapid_rating')} (${t('time_10_min')})` },
	];

	return (
		<div className={styles.ratingHistoryPage}>
			<div className={styles.contentWrapper}>
				{/* Top bar with back button & game mode dropdown */}
				<div className={styles.topBar}>
					<button className={styles.backBtn} onClick={handleBack}>
						<ArrowLeft size={14} aria-hidden="true" />
						<span>{t('back_to_profile')}</span>
					</button>

					<div className={styles.modeSelectorGroup}>
						<label className={styles.modeLabel}>
							{t('filter_mode')}:
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
							src={user.avatar && user.avatar !== 'default.jpg' ? `/uploads/${user.avatar}` : '/assets/default.jpg'}
							alt={user.username}
							className={styles.avatar}
							onError={(e) => {
								const target = e.currentTarget
								if (!target.src.endsWith('/assets/default.jpg')) {
									target.src = '/assets/default.jpg'
								}
							}}
						/>
						<div className={styles.userInfo}>
							<span className={styles.userName}>{user.username}</span>
							<span className={styles.userSubtitle}>
								{t('rating_overview')}
							</span>
						</div>
					</div>
				)}

				{/* Main Big Rating Chart */}
				<BigRatingChart mode={selectedMode} history={currentModeHistory} />
			</div>
		</div>
	);
};

export default RatingHistoryPage;

