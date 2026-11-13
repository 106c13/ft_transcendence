import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Clock, Swords } from 'lucide-react';
import { Chess } from 'chess.js';
import io from 'socket.io-client';
import ChessBoard from '../ChessBoard/ChessBoard';
import GameModeIcon from '../GameModeIcon/GameModeIcon';
import OngoingGamePlayerBanner from '../OngoingGamePlayerBanner/OngoingGamePlayerBanner';
import { playSound } from '../../utils/sound';
import { calculateBoardMaterial } from '../../utils/gameUtils';
import type {
	LiveGamePlayer,
	LiveGameData,
} from '../../utils/gameUtils';
import styles from './OngoingGameCard.module.css';

export type { LiveGamePlayer, LiveGameData };

type Props = {
	gameData: LiveGameData;
	profileUsername: string;
	currentUserId?: number | null;
	onGameOverStartExit?: () => void;
	onGameOverDone: () => void;
};

const OngoingGameCard = ({
	gameData,
	profileUsername,
	currentUserId,
	onGameOverStartExit,
	onGameOverDone,
}: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [fen, setFen] = useState(gameData.fen);
	const [turn, setTurn] = useState<'w' | 'b'>(gameData.turn);
	const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(gameData.lastMove || null);
	const [moveSAN, setMoveSAN] = useState<string[]>(gameData.history ?? []);
	const [moveTimes, setMoveTimes] = useState<number[]>(gameData.moveTimes ?? []);
	const [isCheck, setIsCheck] = useState(!!gameData.isCheck);
	const [isPaused, setIsPaused] = useState(!!gameData.isPaused);
	const [whitePlayer, setWhitePlayer] = useState<LiveGamePlayer>(gameData.whitePlayer);
	const [blackPlayer, setBlackPlayer] = useState<LiveGamePlayer>(gameData.blackPlayer);

	const [gameOverResult, setGameOverResult] = useState<{
		winner: 'w' | 'b' | 'draw' | null;
		reason?: string;
		matchId?: number;
	} | null>(null);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [isResultExiting, setIsResultExiting] = useState(false);
	const [newMatchPhase, setNewMatchPhase] = useState<'idle' | 'enter' | 'exit'>('idle');
	const [isExiting, setIsExiting] = useState(false);

	const prevGameIdRef = useRef<string>(gameData.gameId);

	// If gameData changes to another game (e.g. rematch or next match)
	useEffect(() => {
		if (prevGameIdRef.current === gameData.gameId) return;
		prevGameIdRef.current = gameData.gameId;

		let exitTimer: ReturnType<typeof setTimeout> | undefined;
		let doneTimer: ReturnType<typeof setTimeout> | undefined;
		let transitionTimer: ReturnType<typeof setTimeout> | undefined;

		const triggerNewMatchBanner = () => {
			setNewMatchPhase('enter');
			exitTimer = setTimeout(() => {
				setNewMatchPhase('exit');
			}, 2100);
			doneTimer = setTimeout(() => {
				setNewMatchPhase('idle');
			}, 2500);
		};

		const syncTimer = setTimeout(() => {
			setIsExiting(false);
			setFen(gameData.fen);
			setTurn(gameData.turn);
			setLastMove(gameData.lastMove || null);
			setMoveSAN(gameData.history ?? []);
			setMoveTimes(gameData.moveTimes ?? []);
			setIsCheck(!!gameData.isCheck);
			setIsPaused(!!gameData.isPaused);
			setWhitePlayer(gameData.whitePlayer);
			setBlackPlayer(gameData.blackPlayer);
			playSound('game-start');

			if (gameOverResult) {
				setIsResultExiting(true);
				transitionTimer = setTimeout(() => {
					setGameOverResult(null);
					setCountdown(null);
					setIsResultExiting(false);
					triggerNewMatchBanner();
				}, 350);
			} else {
				setGameOverResult(null);
				setCountdown(null);
				setIsResultExiting(false);
				triggerNewMatchBanner();
			}
		}, 0);

		return () => {
			clearTimeout(syncTimer);
			if (transitionTimer) clearTimeout(transitionTimer);
			if (exitTimer) clearTimeout(exitTimer);
			if (doneTimer) clearTimeout(doneTimer);
		};
	}, [gameData, gameOverResult]);

	// Socket connection to /game for real-time moves, move times, and game_over events
	useEffect(() => {
		if (!gameData.gameId) return;

		const socket = io('/game', {
			query: { userId: currentUserId ? currentUserId.toString() : '' },
			transports: ['websocket', 'polling'],
		});

		const joinRoom = () => {
			socket.emit('join_game', { gameId: gameData.gameId, preview: true });
		};

		socket.on('connect', joinRoom);
		if (socket.connected) {
			joinRoom();
		}

		socket.on('game_state', (data: {
			fen?: string;
			turn?: 'w' | 'b';
			history?: string[];
			moveTimes?: number[];
			isPaused?: boolean;
			whitePlayer?: LiveGamePlayer;
			blackPlayer?: LiveGamePlayer;
		}) => {
			if (data.fen) setFen(data.fen);
			if (data.turn) setTurn(data.turn);
			if (Array.isArray(data.history)) setMoveSAN(data.history);
			if (Array.isArray(data.moveTimes)) setMoveTimes(data.moveTimes);
			if (data.isPaused !== undefined) setIsPaused(data.isPaused);
			if (data.whitePlayer) setWhitePlayer(data.whitePlayer);
			if (data.blackPlayer) setBlackPlayer(data.blackPlayer);
		});

		socket.on('move_made', (data: {
			fen: string;
			turn: 'w' | 'b';
			lastMove?: { from: string; to: string };
			isCheck?: boolean;
			san?: string;
			timeSpent?: number;
		}) => {
			setFen(data.fen);
			setTurn(data.turn);
			if (data.lastMove) setLastMove(data.lastMove);
			setIsCheck(!!data.isCheck);
			if (data.san) {
				const sanMove = data.san;
				const spentMs = data.timeSpent ?? 0;
				setMoveSAN((prev) => [...prev, sanMove]);
				setMoveTimes((prev) => [...prev, spentMs]);
			}

			if (data.san?.includes('#') || data.isCheck) {
				playSound('move-check');
			} else if (data.san?.includes('x')) {
				playSound('capture');
			} else {
				playSound('move-opponent');
			}
		});

		socket.on('opponent_disconnected', () => {
			setIsPaused(true);
		});

		socket.on('opponent_reconnected', () => {
			setIsPaused(false);
		});

		socket.on('game_over', (data: {
			winner: 'w' | 'b' | 'draw' | null;
			reason?: string;
			matchId?: number;
		}) => {
			setGameOverResult({
				winner: data.winner,
				reason: data.reason,
				matchId: data.matchId,
			});
			setCountdown(5);
			playSound('game-end');
		});

		return () => {
			socket.disconnect();
		};
	}, [gameData.gameId, currentUserId]);

	// Tick the countdown and exit once it hits zero
	useEffect(() => {
		if (!gameOverResult || countdown === null) return;
		if (countdown <= 0) {
			const startExitId = setTimeout(() => {
				setIsExiting(true);
				onGameOverStartExit?.();
			}, 0);
			const doneExitId = setTimeout(() => {
				onGameOverDone();
			}, 650);
			return () => {
				clearTimeout(startExitId);
				clearTimeout(doneExitId);
			};
		}
		const id = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
		return () => clearTimeout(id);
	}, [gameOverResult, countdown, onGameOverStartExit, onGameOverDone]);

	// Orientation: Profile user is hero at bottom, opponent is at top
	const isProfileBlack = profileUsername.toLowerCase() === blackPlayer.username.toLowerCase();
	const bottomColor: 'w' | 'b' = isProfileBlack ? 'b' : 'w';
	const topColor: 'w' | 'b' = isProfileBlack ? 'w' : 'b';
	const bottomPlayer = isProfileBlack ? blackPlayer : whitePlayer;
	const topPlayer = isProfileBlack ? whitePlayer : blackPlayer;

	const ranks = isProfileBlack ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
	const files = isProfileBlack ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

	const displayChess = useMemo(() => {
		try {
			return new Chess(fen);
		} catch {
			return new Chess();
		}
	}, [fen]);

	const { captured, whiteScore, blackScore } = useMemo(
		() => calculateBoardMaterial(displayChess),
		[displayChess]
	);

	// Game over classification: distinguish ABANDONED from DRAW
	const isAbandoned = gameOverResult?.reason === 'ABANDONED';
	const isDraw =
		gameOverResult !== null &&
		!isAbandoned &&
		(gameOverResult.winner === null ||
			gameOverResult.winner === 'draw' ||
			gameOverResult.reason === 'DRAW' ||
			gameOverResult.reason === 'STALEMATE' ||
			gameOverResult.reason === 'INSUFFICIENT_MATERIAL' ||
			gameOverResult.reason === 'THREEFOLD_REPETITION');

	const isProfileWinner =
		!isAbandoned &&
		!isDraw &&
		((gameOverResult?.winner === 'w' && !isProfileBlack) ||
			(gameOverResult?.winner === 'b' && isProfileBlack));

	const rawMode = (gameData.mode || 'blitz').toLowerCase();
	const baseMode = rawMode.startsWith('bullet')
		? 'bullet'
		: rawMode.startsWith('blitz')
		? 'blitz'
		: rawMode.startsWith('rapid')
		? 'rapid'
		: rawMode;
	const hasIncrement = rawMode.includes('+2');
	const modeClass =
		baseMode === 'bullet'
			? styles.modeBullet
			: baseMode === 'blitz'
			? styles.modeBlitz
			: baseMode === 'rapid'
			? styles.modeRapid
			: styles.modeDefault;

	const handleCardClick = () => {
		navigate(`/game/${gameData.gameId}`);
	};

	const getLatestMoveForColor = (color: 'w' | 'b') => {
		for (let idx = moveSAN.length - 1; idx >= 0; idx--) {
			if ((color === 'w' && idx % 2 === 0) || (color === 'b' && idx % 2 === 1)) {
				return {
					san: moveSAN[idx] ?? null,
					timeSpent: moveTimes[idx],
				};
			}
		}
		return {
			san: null,
			timeSpent: undefined,
		};
	};

	const topLatestMove = getLatestMoveForColor(topColor);
	const bottomLatestMove = getLatestMoveForColor(bottomColor);

	return (
		<div
			className={`${styles.ongoingGameCard} ${isExiting ? styles.isExiting : ''}`}
			onClick={handleCardClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleCardClick();
				}
			}}
			role="button"
			tabIndex={0}
		>
			{/* Left: Live ChessBoard */}
			<div className={styles.boardSection}>
				{gameOverResult && (
					<div
						className={`${styles.resultBadge} ${
							isAbandoned
								? styles.abandonedBadge
								: isDraw
								? styles.drawBadge
								: isProfileWinner
								? styles.victoryBadge
								: styles.defeatBadge
						} ${isResultExiting ? styles.resultBadgeExit : ''}`}
					>
						<span className={styles.resultLabelContent}>
							{isAbandoned ? (
								t('reason_abandoned')
							) : isDraw ? (
								`½ - ½ ${t('draw')}`
							) : isProfileWinner ? (
								<>
									<Trophy size={13} aria-hidden="true" />
									<span>{t('victory')}</span>
								</>
							) : (
								t('defeat')
							)}
						</span>
					</div>
				)}

				{!gameOverResult && newMatchPhase !== 'idle' && (
					<div
						className={`${styles.newMatchBanner} ${
							newMatchPhase === 'exit' ? styles.newMatchBannerExit : ''
						}`}
					>
						<Swords size={14} aria-hidden="true" />
						<span>{t('new_match_started')}</span>
					</div>
				)}

				<div className={styles.boardWrapper}>
					<ChessBoard
						displayChess={displayChess}
						displayFen={fen}
						ranks={ranks}
						files={files}
						selectedSquare={null}
						validMoves={[]}
						lastMove={lastMove}
						premoveSquares={new Set()}
						isReviewing={false}
						isCheck={isCheck}
						turn={turn}
						playerColor={bottomColor}
						showPromotion={false}
						promotionSquare={null}
						isPaused={isPaused}
						onSquareClick={() => {}}
						onSquareSelect={() => {}}
						onPieceDrop={() => {}}
						onPromotionSelect={() => {}}
						onPromotionCancel={() => {}}
						isGameOver={!!gameOverResult}
						isViewer={true}
					/>
				</div>
			</div>

			{/* Right: Top Player Banner, Match Status Divider, Bottom Player Banner */}
			<div className={styles.infoSection}>
				<OngoingGamePlayerBanner
					player={topPlayer}
					color={topColor}
					isHero={false}
					isPlayerTurn={!gameOverResult && turn === topColor}
					isPlayerWinner={!isAbandoned && !isDraw && gameOverResult?.winner === topColor}
					baseMode={baseMode}
					capturedPieces={topColor === 'w' ? captured.b : captured.w}
					materialDiff={
						topColor === 'w'
							? Math.max(0, whiteScore - blackScore)
							: Math.max(0, blackScore - whiteScore)
					}
					latestSan={topLatestMove.san}
					latestTimeSpent={topLatestMove.timeSpent}
				/>

				<div className={styles.dividerRow}>
					<div className={styles.metaGroup}>
						{gameOverResult ? (
							<div className={styles.finishedBadge}>
								<span>{t('match_finished')}</span>
								{countdown !== null && (
									<span className={styles.countdownPill}>
										<Clock size={11} aria-hidden="true" />
										<span>{countdown}s</span>
									</span>
								)}
							</div>
						) : (
							<div className={styles.liveBadge}>
								<span className={styles.liveDot} aria-hidden="true" />
								<span>{t('live')}</span>
							</div>
						)}

						<div className={styles.modeBadge}>
							<GameModeIcon mode={gameData.mode} size={14} />
							<span className={`${styles.modeName} ${modeClass}`}>
								{t(baseMode)}
								{hasIncrement ? ' +2' : ''}
							</span>
						</div>
					</div>
				</div>

				<OngoingGamePlayerBanner
					player={bottomPlayer}
					color={bottomColor}
					isHero={true}
					isPlayerTurn={!gameOverResult && turn === bottomColor}
					isPlayerWinner={!isAbandoned && !isDraw && gameOverResult?.winner === bottomColor}
					baseMode={baseMode}
					capturedPieces={bottomColor === 'w' ? captured.b : captured.w}
					materialDiff={
						bottomColor === 'w'
							? Math.max(0, whiteScore - blackScore)
							: Math.max(0, blackScore - whiteScore)
					}
					latestSan={bottomLatestMove.san}
					latestTimeSpent={bottomLatestMove.timeSpent}
				/>
			</div>
		</div>
	);
};

export default OngoingGameCard;
