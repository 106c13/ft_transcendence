import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { LeaderboardPlayer } from '../../utils/leaderboardUtils';
import LeaderboardHeader from '../../components/LeaderboardHeader/LeaderboardHeader';
import LeaderboardPodium from '../../components/LeaderboardPodium/LeaderboardPodium';
import LeaderboardToolbar from '../../components/LeaderboardToolbar/LeaderboardToolbar';
import LeaderboardTable from '../../components/LeaderboardTable/LeaderboardTable';
import LeaderboardPagination from '../../components/LeaderboardPagination/LeaderboardPagination';

export type { LeaderboardPlayer };

const LeaderboardPage = () => {
	const { t } = useTranslation();
	usePageTitle(t('leaderboard'));
	const navigate = useNavigate();

	const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [topThree, setTopThree] = useState<{
		first: LeaderboardPlayer;
		second: LeaderboardPlayer;
		third: LeaderboardPlayer;
	} | null>(null);

	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [mode, setMode] = useState<'all' | 'bullet' | 'blitz' | 'rapid'>('all');
	const [minWinRate, setMinWinRate] = useState<number>(0);
	const [status, setStatus] = useState<'all' | 'online' | 'ingame'>('all');
	const [sortBy, setSortBy] = useState<string>('leaderboardRating');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	const [showFilters, setShowFilters] = useState(false);
	const [showFormulaInfo, setShowFormulaInfo] = useState(false);

	// Preserve scroll position across filter and sort changes
	const scrollPosRef = useRef<number>(0);
	const isUpdatingRef = useRef<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			if (!isUpdatingRef.current) {
				scrollPosRef.current = window.scrollY;
			}
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const fetchLeaderboard = useCallback(async () => {
		setLoading(true);
		try {
			const query = new URLSearchParams();
			query.set('page', String(page));
			query.set('limit', '30');

			if (debouncedSearch.trim()) query.set('search', debouncedSearch.trim());
			if (mode !== 'all') query.set('mode', mode);
			if (minWinRate > 0) query.set('minWinRate', String(minWinRate));
			if (status !== 'all') query.set('status', status);
			query.set('sortBy', sortBy);
			query.set('order', order);

			const token = localStorage.getItem('token');
			const res = await fetch(`/api/leaderboard?${query.toString()}`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});

			if (res.ok) {
				const data = await res.json();
				const playerList: LeaderboardPlayer[] = data.players || [];
				setPlayers(playerList);
				setTotal(data.total || 0);
				setTotalPages(data.totalPages || 1);
				if (playerList.length >= 3) {
					setTopThree((prev) => {
						if (prev) return prev;
						return {
							first: playerList.find((p) => p.rank === 1) || playerList[0],
							second: playerList.find((p) => p.rank === 2) || playerList[1],
							third: playerList.find((p) => p.rank === 3) || playerList[2],
						};
					});
				}
			}
		} catch {
			// Keep existing state on failure
		} finally {
			setLoading(false);
		}
	}, [page, debouncedSearch, mode, minWinRate, status, sortBy, order]);

	useEffect(() => {
		fetchLeaderboard();
	}, [fetchLeaderboard]);

	// Preserve scroll position across filter and sort changes
	useLayoutEffect(() => {
		isUpdatingRef.current = true;
		if (Math.abs(window.scrollY - scrollPosRef.current) > 0) {
			window.scrollTo({ top: scrollPosRef.current, behavior: 'instant' });
		}
		const timer = requestAnimationFrame(() => {
			if (Math.abs(window.scrollY - scrollPosRef.current) > 0) {
				window.scrollTo({ top: scrollPosRef.current, behavior: 'instant' });
			}
			isUpdatingRef.current = false;
		});
		return () => cancelAnimationFrame(timer);
	}, [mode, sortBy, order, minWinRate, status, showFilters, showFormulaInfo, page, players]);

	const handleSort = (field: string) => {
		if (sortBy === field) {
			setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
		} else {
			setSortBy(field);
			setOrder('desc');
		}
		setPage(1);
	};

	const handleResetFilters = () => {
		setSearch('');
		setDebouncedSearch('');
		setMode('all');
		setMinWinRate(0);
		setStatus('all');
		setSortBy('leaderboardRating');
		setOrder('desc');
		setPage(1);
	};

	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (debouncedSearch) count++;
		if (mode !== 'all') count++;
		if (minWinRate > 0) count++;
		if (status !== 'all') count++;
		if (sortBy !== 'leaderboardRating' || order !== 'desc') count++;
		return count;
	}, [debouncedSearch, mode, minWinRate, status, sortBy, order]);

	useEffect(() => {
		const fetchTopChampions = async () => {
			try {
				const token = localStorage.getItem('token');
				const res = await fetch('/api/leaderboard?limit=3&sortBy=leaderboardRating&order=desc', {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				if (res.ok) {
					const data = await res.json();
					if (data.players && data.players.length >= 3) {
						setTopThree({
							first: data.players.find((p: LeaderboardPlayer) => p.rank === 1) || data.players[0],
							second: data.players.find((p: LeaderboardPlayer) => p.rank === 2) || data.players[1],
							third: data.players.find((p: LeaderboardPlayer) => p.rank === 3) || data.players[2],
						});
					}
				}
			} catch {
				// Fall back to current page slice
			}
		};
		fetchTopChampions();
	}, []);

	const podiumPlayers = useMemo(() => {
		if (topThree) return topThree;
		if (players.length >= 3) {
			return {
				first: players.find((p) => p.rank === 1) || players[0],
				second: players.find((p) => p.rank === 2) || players[1],
				third: players.find((p) => p.rank === 3) || players[2],
			};
		}
		return null;
	}, [topThree, players]);

	return (
		<div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center pt-20 px-3 min-[769px]:px-6 pb-6 box-border text-slate-200 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,#0F172A_40%,#090D16_100%)] [overflow-anchor:none]">
			<div className="w-full max-w-[960px] flex flex-col gap-4 [overflow-anchor:none]">
				<LeaderboardHeader
					total={total}
					showFormulaInfo={showFormulaInfo}
					onToggleFormulaInfo={() => setShowFormulaInfo(!showFormulaInfo)}
				/>

				<LeaderboardPodium
					podiumPlayers={podiumPlayers}
					onPlayerClick={(username) => navigate(`/profile/${username}`)}
				/>

				<LeaderboardToolbar
					search={search}
					onSearchChange={setSearch}
					debouncedSearch={debouncedSearch}
					mode={mode}
					onModeChange={(newMode) => {
						setMode(newMode);
						setPage(1);
					}}
					showFilters={showFilters}
					onToggleFilters={() => setShowFilters(!showFilters)}
					activeFilterCount={activeFilterCount}
					minWinRate={minWinRate}
					onMinWinRateChange={(rate) => {
						setMinWinRate(rate);
						setPage(1);
					}}
					status={status}
					onStatusChange={(newStatus) => {
						setStatus(newStatus);
						setPage(1);
					}}
					sortBy={sortBy}
					onSortByChange={(newSort) => {
						setSortBy(newSort);
						setPage(1);
					}}
					order={order}
					onOrderChange={(newOrder) => {
						setOrder(newOrder);
						setPage(1);
					}}
					onResetFilters={handleResetFilters}
				/>

				<LeaderboardTable
					players={players}
					loading={loading}
					sortBy={sortBy}
					order={order}
					onSort={handleSort}
					onPlayerClick={(username) => navigate(`/profile/${username}`)}
					onResetFilters={handleResetFilters}
				/>

				<LeaderboardPagination
					page={page}
					totalPages={totalPages}
					total={total}
					onPageChange={setPage}
				/>
			</div>
		</div>
	);
};

export default LeaderboardPage;
