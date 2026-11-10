import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { useGameHistory } from '../../hooks/useGameHistory';
import { useRatingHistory, type RatingCategory } from '../../hooks/useRatingHistory';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';
import { isValidUsername, type User } from '../../utils/profileUtils';
import type { LayoutContextType } from '../../utils/layoutContextUtils';
import BigRatingChart from '../../components/BigRatingChart/BigRatingChart';

const VALID_MODES: RatingCategory[] = ['bullet', 'blitz', 'rapid'];

function parseModesFromSearch(search: string): RatingCategory[] {
	const raw = search.startsWith('?') ? search.slice(1) : search;
	if (!raw) return ['blitz'];

	// Extract tokens from ?modes=rapid&blitz or ?mode=bullet or ?modes=bullet,blitz
	const parts = raw.split(/[&,]/);
	const found: RatingCategory[] = [];

	for (const part of parts) {
		const eqIdx = part.indexOf('=');
		if (eqIdx !== -1) {
			const key = part.slice(0, eqIdx).trim();
			const val = part.slice(eqIdx + 1).trim() as RatingCategory;
			if ((key === 'modes' || key === 'mode') && VALID_MODES.includes(val)) {
				if (!found.includes(val)) found.push(val);
			}
		} else {
			const val = part.trim() as RatingCategory;
			if (VALID_MODES.includes(val) && !found.includes(val)) {
				found.push(val);
			}
		}
	}

	if (found.length === 0) return ['blitz'];
	return VALID_MODES.filter((m) => found.includes(m));
}

const RatingHistoryPage = () => {
	const { t } = useTranslation();
	const { toast } = useToast();
	usePageTitle('page_title_rating_history');
	const { username: paramUsername } = useParams();
	const { currentUser } = useOutletContext<LayoutContextType>();
	const location = useLocation();
	const navigate = useNavigate();

	const urlRequestedModes = useMemo(
		() => parseModesFromSearch(location.search),
		[location.search]
	);

	const [user, setUser] = useState<User | null>(null);
	const [loadingUser, setLoadingUser] = useState(true);

	// Fetch user details (or use currentUser from MainLayout when viewing own rating history)
	useEffect(() => {
		if (!paramUsername || (currentUser && paramUsername.toLowerCase() === currentUser.username.toLowerCase())) {
			setUser(currentUser);
			setLoadingUser(false);
			return;
		}

		let isMounted = true;

		const fetchUser = async () => {
			if (!isValidUsername(paramUsername)) {
				setUser(null);
				setLoadingUser(false);
				toast.error(t('user_not_found'), { id: 'user_not_found' });
				navigate('/home', { replace: true });
				return;
			}

			setLoadingUser(true);
			try {
				const token = localStorage.getItem('token');
				const res = await fetch(`/api/users/${encodeURIComponent(paramUsername)}`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});

				if (!isMounted) return;

				if (!res.ok) {
					setUser(null);
					toast.error(t('user_not_found'), { id: 'user_not_found' });
					navigate('/home', { replace: true });
					return;
				}

				const data = await res.json();
				if (!isMounted) return;

				setUser(data);
			} catch {
				if (!isMounted) return;
				setUser(null);
				toast.error(t('user_not_found'), { id: 'user_not_found' });
				navigate('/home', { replace: true });
			} finally {
				if (isMounted) {
					setLoadingUser(false);
				}
			}
		};

		fetchUser();

		return () => {
			isMounted = false;
		};
	}, [paramUsername, currentUser, navigate, t, toast]);

	const actualUsername = user?.username || '';
	const gameHistory = useGameHistory(actualUsername);
	const ratingData = useRatingHistory(gameHistory.matches, actualUsername, user?.ratings);

	// Determine which modes actually have recorded games
	const playableModes = useMemo(() => {
		return VALID_MODES.filter((m) => {
			const h = ratingData[m];
			if (!h) return false;
			const realMatches = h.allTime.filter((p) => p.id !== 'init');
			return h.gamesPlayed > 0 || realMatches.length > 0;
		});
	}, [ratingData]);

	// Filter activeModes so unplayed modes are never selected on the chart
	const activeModes = useMemo(() => {
		if (playableModes.length === 0) return [];
		const validRequested = urlRequestedModes.filter((m) => playableModes.includes(m));
		if (validRequested.length > 0) return validRequested;
		return [playableModes[0]];
	}, [urlRequestedModes, playableModes]);

	// Keep URL query string clean and synced if unplayed modes were in the URL (after data finishes loading)
	useEffect(() => {
		if (loadingUser || gameHistory.loading || playableModes.length === 0) return;

		const isSame =
			activeModes.length === urlRequestedModes.length &&
			activeModes.every((m, idx) => m === urlRequestedModes[idx]);

		if (!isSame && activeModes.length > 0) {
			const queryString = `?modes=${activeModes.join('&')}`;
			navigate(`${location.pathname}${queryString}`, { replace: true });
		}
	}, [
		loadingUser,
		gameHistory.loading,
		playableModes.length,
		activeModes,
		urlRequestedModes,
		location.pathname,
		navigate,
	]);

	const handleToggleMode = useCallback(
		(mode: RatingCategory) => {
			if (!playableModes.includes(mode)) return;

			const isSelected = activeModes.includes(mode);
			let nextModes: RatingCategory[];

			if (isSelected) {
				if (activeModes.length === 1) return;
				nextModes = activeModes.filter((m) => m !== mode);
			} else {
				nextModes = VALID_MODES.filter(
					(m) => playableModes.includes(m) && (activeModes.includes(m) || m === mode)
				);
			}

			const queryString = `?modes=${nextModes.join('&')}`;
			navigate(`${location.pathname}${queryString}`, { replace: true });
		},
		[activeModes, playableModes, location.pathname, navigate]
	);

	if (loadingUser && !user) {
		return (
			<div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center pt-[72px] min-[769px]:pt-[84px] px-4 min-[769px]:px-10 pb-8 min-[769px]:pb-10 bg-slate-900 text-slate-200 box-border">
				<div className="flex flex-col items-center justify-center min-h-[400px] gap-3.5 text-slate-400 w-full">
					<TrendingUp size={32} className="text-blue-400 animate-bounce" aria-hidden="true" />
					<p>{t('loading')}</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const primaryMode = activeModes[0] || playableModes[0] || 'blitz';

	return (
		<div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center pt-[72px] min-[769px]:pt-[84px] px-4 min-[769px]:px-10 pb-8 min-[769px]:pb-10 bg-slate-900 text-slate-200 box-border">
			<div className="w-full max-w-[860px] mx-auto flex flex-col gap-5">
				{/* User header */}
				{user && (
					<div className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-xl bg-slate-800 border border-slate-400/12 w-full box-border">
						<img
							src={
								user.avatar && user.avatar !== 'default.jpg'
									? `/uploads/${user.avatar}`
									: '/assets/default.jpg'
							}
							alt={user.username}
							className="w-[46px] h-[46px] aspect-square rounded-full object-cover block border-2 border-slate-400/20 bg-slate-700 shrink-0"
							onError={(e) => {
								const target = e.currentTarget;
								if (!target.src.endsWith('/assets/default.jpg')) {
									target.src = '/assets/default.jpg';
								}
							}}
						/>
						<div className="flex flex-col gap-0.5">
							<span className="text-lg font-extrabold text-slate-50 tracking-[-0.3px]">{user.username}</span>
							<span className="text-xs text-slate-400">{t('rating_overview')}</span>
						</div>
					</div>
				)}

				{/* Main Big Rating Chart with toggleable mode legends */}
				<BigRatingChart
					mode={primaryMode}
					activeModes={activeModes}
					ratingData={ratingData}
					history={ratingData[primaryMode]}
					onToggleMode={handleToggleMode}
				/>
			</div>
		</div>
	);
};

export default RatingHistoryPage;
