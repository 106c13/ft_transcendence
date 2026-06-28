import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import io, { Socket } from 'socket.io-client';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import './Game.css';

interface User {
	id: number;
	username: string;
	email: string;
	avatar?: string;
	bio?: string;
	status?: 'ONLINE' | 'OFFLINE' | 'INGAME';
}

export default function Game() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// Search & layout states (align with Left/Right Sidebars)
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [showResults, setShowResults] = useState(false);
	const [isSearchingUser, setIsSearchingUser] = useState(false);
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	// Matchmaking and Game States
	const [gameState, setGameState] = useState<'searching' | 'playing'>('searching');
	const [selectedMode, setSelectedMode] = useState<'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'>(
		(searchParams.get('mode') as any) || 'blitz'
	);
	const [opponentName, setOpponentName] = useState('');
	const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w'); // default to White
	const [gameId, setGameId] = useState('');
	const [turn, setTurn] = useState<'w' | 'b'>('w');
	const [isCheck, setIsCheck] = useState(false);
	
	// Game Outcome States
	const [isGameOver, setIsGameOver] = useState(false);
	const [hideGameOverModal, setHideGameOverModal] = useState(false);
	const [winnerColor, setWinnerColor] = useState<'w' | 'b' | null>(null);
	const [gameOverReason, setGameOverReason] = useState('');

	// Timing States
	const [whiteTime, setWhiteTime] = useState(180000); // in ms
	const [blackTime, setBlackTime] = useState(180000); // in ms
	const [isPaused, setIsPaused] = useState(false);
	const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);

	// Chess Rules engine (local instance for highlights)
	const [localChess] = useState(() => new Chess());
	const [boardFen, setBoardFen] = useState(localChess.fen());
	const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
	const [validMoves, setValidMoves] = useState<string[]>([]);
	const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

	// Promotion Modal states
	const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
	const [showPromotion, setShowPromotion] = useState(false);

	// Move History for browsing (list of FEN strings after each half-move; index 0 = start)
	const [moveHistory, setMoveHistory] = useState<string[]>(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']);
	const [viewIndex, setViewIndex] = useState<number>(0); // which half-move we're viewing
	const moveListRef = useRef<HTMLDivElement>(null);
	// Separate Chess instance just for rendering past positions
	const [displayChess] = useState(() => new Chess());

	const [moveSAN, setMoveSAN] = useState<string[]>([]);

	// WebSocket ref
	const socketRef = useRef<Socket | null>(null);
	const token = localStorage.getItem('token');

	// Current User Loading
	useEffect(() => {
		const loadCurrentUser = async () => {
			if (!token) {
				navigate('/login');
				return;
			}
			try {
				const res = await fetch('/api/users/me', {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const data = await res.json();
					setCurrentUser(data);
				} else {
					localStorage.removeItem('token');
					navigate('/login');
				}
			} catch (error) {
				console.error('Error loading user:', error);
			}
		};
		loadCurrentUser();
	}, [navigate, token]);

	// Search bar handlers
	useEffect(() => {
		const handleSearch = async () => {
			if (!searchQuery.trim()) {
				setSearchResults([]);
				setShowResults(false);
				return;
			}
			setIsSearchingUser(true);
			try {
				const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const data = await res.json();
					setSearchResults(data);
					setShowResults(true);
				}
			} catch (error) {
				console.error('Search error:', error);
			} finally {
				setIsSearchingUser(false);
			}
		};

		const timer = setTimeout(() => {
			if (searchQuery) handleSearch();
			else setShowResults(false);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, token]);

	const handleUserClick = (username: string) => {
		setShowResults(false);
		setSearchQuery('');
		navigate(`/profile/${username}`);
	};

	const getStatusDot = (status?: string) => {
		switch (status) {
			case 'ONLINE': return <span className="status-dot online"></span>;
			case 'INGAME': return <span className="status-dot ingame"></span>;
			default: return <span className="status-dot offline"></span>;
		}
	};

	// WebSocket connection coordination
	useEffect(() => {
		if (!currentUser) return;

		const modeParam = (searchParams.get('mode') || 'blitz') as 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2';
		setSelectedMode(modeParam);

		const socket = io('http://localhost:8080/game', {
			query: { userId: currentUser.id.toString() },
			transports: ['websocket'],
		});
		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('Game Socket connected');
			// Auto-start matchmaking immediately with the mode from URL
			const mode = (searchParams.get('mode') || 'blitz') as 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2';
			setGameState('searching');
			socket.emit('find_match', { mode });
		});

		socket.on('match_found', (data: {
			gameId: string;
			color: 'w' | 'b';
			opponentName: string;
			fen: string;
			whiteTime: number;
			blackTime: number;
			turn: 'w' | 'b';
			history: string[];
			mode: 'bullet' | 'blitz' | 'rapid';
			isPaused?: boolean;
		}) => {
			setGameId(data.gameId);
			setPlayerColor(data.color);
			setOpponentName(data.opponentName);
			localChess.load(data.fen);
			setBoardFen(data.fen);
			setWhiteTime(data.whiteTime);
			setBlackTime(data.blackTime);
			setTurn(data.turn);
			setGameState('playing');
			setIsGameOver(false);
			setHideGameOverModal(false);
			setWinnerColor(null);
			setGameOverReason('');
			setSelectedSquare(null);
			setValidMoves([]);
			setLastMove(null);
			setIsPaused(data.isPaused || false);
			setSelectedMode(data.mode);
			// Reset history — if resuming, load existing moves as snapshots
			const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
			const historyFens: string[] = [startFen];
			if (data.history && data.history.length > 0) {
				const replayChess = new Chess();
				for (const san of data.history) {
					try { replayChess.move(san); } catch {}
					historyFens.push(replayChess.fen());
				}
			}
			setMoveHistory(historyFens);
			setViewIndex(historyFens.length - 1);
			setMoveSAN(data.history);
		});

		socket.on('move_made', (data: {
			fen: string;
			san: string;
			lastMove: { from: string; to: string };
			turn: 'w' | 'b';
			whiteTime: number;
			blackTime: number;
			isCheck: boolean;
			isGameOver: boolean;
		}) => {
			localChess.load(data.fen);
			setBoardFen(data.fen);
			setTurn(data.turn);
			setWhiteTime(data.whiteTime);
			setBlackTime(data.blackTime);
			setIsCheck(data.isCheck);
			setLastMove(data.lastMove);
			setSelectedSquare(null);
			setValidMoves([]);
			// Append FEN snapshot and jump to latest
			setMoveHistory(prev => {
				const next = [...prev, data.fen];
				setViewIndex(next.length - 1);
				return next;
			});
			setMoveSAN(prev => [...prev, data.san]);
		});

		socket.on('opponent_disconnected', (data: { userId: number; graceSeconds: number }) => {
			setIsPaused(true);
			setPauseCountdown(data.graceSeconds);
		});

		socket.on('opponent_reconnected', () => {
			setIsPaused(false);
			setPauseCountdown(null);
		});

		socket.on('game_over', (data: {
			winner: 'w' | 'b' | null;
			reason: string;
			fen: string;
		}) => {
			setIsGameOver(true);
			setHideGameOverModal(false);
			setWinnerColor(data.winner);
			setGameOverReason(data.reason);
			localChess.load(data.fen);
			setBoardFen(data.fen);
			setIsPaused(false);
			setPauseCountdown(null);
			// Make sure the final position is in history
			setMoveHistory(prev => {
				const last = prev[prev.length - 1];
				if (last === data.fen) return prev;
				const next = [...prev, data.fen];
				setViewIndex(next.length - 1);
				return next;
			});
		});

		socket.on('error', (err: { message: string }) => {
			alert(err.message || 'Error occurred');
		});

		return () => {
			socket.disconnect();
		};
	}, [currentUser, localChess, searchParams]);

	// Ticking pause grace countdown
	useEffect(() => {
		if (!isPaused || pauseCountdown === null || pauseCountdown <= 0) return;
		const timer = setTimeout(() => {
			setPauseCountdown(prev => (prev !== null ? prev - 1 : null));
		}, 1000);
		return () => clearTimeout(timer);
	}, [isPaused, pauseCountdown]);

	// Active clock tick countdown
	useEffect(() => {
		if (gameState !== 'playing' || isGameOver || isPaused) return;

		const timerInterval = setInterval(() => {
			if (turn === 'w') {
				setWhiteTime(prev => Math.max(0, prev - 100));
			} else {
				setBlackTime(prev => Math.max(0, prev - 100));
			}
		}, 100);

		return () => clearInterval(timerInterval);
	}, [gameState, isGameOver, isPaused, turn]);

	// Keyboard navigation for move history
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (gameState !== 'playing') return;
			const total = moveHistory.length; // indices 0..total-1
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				setViewIndex(v => Math.max(0, v - 1));
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				setViewIndex(v => Math.min(total - 1, v + 1));
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setViewIndex(total - 1); // jump to last move
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				setViewIndex(0); // jump to starting position
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [gameState, moveHistory.length]);

	// Scroll highlighted move into view
	useEffect(() => {
		if (moveListRef.current) {
			const active = moveListRef.current.querySelector('.move-cell.active-move');
			if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}, [viewIndex]);

	// Format clock timer
	const formatTime = (timeMs: number) => {
		const totalSecs = Math.floor(timeMs / 1000);
		const mins = Math.floor(totalSecs / 60);
		const secs = totalSecs % 60;
		const tenths = Math.floor((timeMs % 1000) / 100);

		const minStr = mins.toString().padStart(2, '0');
		const secStr = secs.toString().padStart(2, '0');
		
		// If less than 15s, show tenths of a second for bullets/blitz urgency
		if (timeMs < 15000) {
			return `${mins}:${secStr}.${tenths}`;
		}
		return `${minStr}:${secStr}`;
	};

	// Start Matchmaking Search
	const startMatchmaking = () => {
		if (socketRef.current) {
			setGameState('searching');
			socketRef.current.emit('find_match', { mode: selectedMode });
		}
	};

	// Cancel Matchmaking Search
	const cancelMatchmaking = () => {
		if (socketRef.current) {
			socketRef.current.emit('leave_game'); // cleans user from matchmaking queues
		}
		navigate('/home');
	};

	// Resignation
	const resignGame = () => {
		if (socketRef.current && gameId) {
			if (confirm(t('confirm_resign', 'Are you sure you want to resign?'))) {
				socketRef.current.emit('leave_game', { gameId });
			}
		}
	};

	// Piece Click/Movement handlers
	const handleDragStart = (e: React.DragEvent, square: string) => {
		if (gameState !== 'playing' || isGameOver || isPaused) {
			e.preventDefault();
			return;
		}
		if (turn !== playerColor) {
			e.preventDefault();
			return;
		}

		const piece = localChess.get(square as Square);
		if (!piece || piece.color !== playerColor) {
			e.preventDefault();
			return;
		}

		e.dataTransfer.setData('text/plain', square);
		e.dataTransfer.effectAllowed = 'move';
		
		setSelectedSquare(square);
		const moves = localChess.moves({ square: square as Square, verbose: true });
		setValidMoves(moves.map(m => m.to));
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault(); // allow drop
	};

	const handleDrop = (e: React.DragEvent, targetSquare: string) => {
		e.preventDefault();
		const sourceSquare = e.dataTransfer.getData('text/plain');
		
		if (sourceSquare && sourceSquare !== targetSquare) {
			if (validMoves.includes(targetSquare)) {
				const selectedPiece = localChess.get(sourceSquare as Square);
				const isPawn = selectedPiece?.type === 'p';
				const isPromotionRank = targetSquare.endsWith('8') || targetSquare.endsWith('1');

				if (isPawn && isPromotionRank) {
					setPendingMove({ from: sourceSquare, to: targetSquare });
					setShowPromotion(true);
				} else {
					sendMove(sourceSquare, targetSquare);
				}
			} else {
				setSelectedSquare(null);
				setValidMoves([]);
			}
		}
	};

	const handleSquareClick = (square: string) => {
		if (gameState !== 'playing' || isGameOver || isPaused) return;

		// Verify it's the current player's turn
		const currentTurnColor = turn;
		if (currentTurnColor !== playerColor) return;

		const piece = localChess.get(square as Square);

		// If a piece belongs to the player is clicked, select it
		if (piece && piece.color === playerColor) {
			setSelectedSquare(square);
			
			// Calculate valid moves
			const moves = localChess.moves({ square: square as Square, verbose: true });
			const targets = moves.map(m => m.to);
			setValidMoves(targets);
			return;
		}

		// Check if clicked square is in valid move list
		if (selectedSquare && validMoves.includes(square)) {
			// Check if move is a pawn promotion (reaches 8th rank for White, 1st for Black)
			const selectedPiece = localChess.get(selectedSquare as Square);
			const isPawn = selectedPiece?.type === 'p';
			const isPromotionRank = square.endsWith('8') || square.endsWith('1');

			if (isPawn && isPromotionRank) {
				setPendingMove({ from: selectedSquare, to: square });
				setShowPromotion(true);
			} else {
				sendMove(selectedSquare, square);
			}
		} else {
			// Clicked elsewhere, reset selection
			setSelectedSquare(null);
			setValidMoves([]);
		}
	};

	const sendMove = (from: string, to: string, promotion?: string) => {
		if (socketRef.current && gameId) {
			socketRef.current.emit('make_move', {
				gameId,
				from,
				to,
				promotion,
			});
			setSelectedSquare(null);
			setValidMoves([]);
		}
	};

	const handlePromotionSelect = (pieceCode: string) => {
		if (pendingMove) {
			sendMove(pendingMove.from, pendingMove.to, pieceCode);
			setPendingMove(null);
			setShowPromotion(false);
		}
	};

	// Calculate captured pieces dynamically based on board state FEN
	const { captured, whiteScore, blackScore } = (() => {
		const initial = {
			w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
			b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
		};

		const current = {
			w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
			b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
		};

		// Scan board
		for (const rank of ['1', '2', '3', '4', '5', '6', '7', '8']) {
			for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
				const piece = localChess.get(`${file}${rank}` as Square);
				if (piece && piece.type !== 'k') {
					current[piece.color][piece.type]++;
				}
			}
		}

		// Calculate difference
		const capturedList = {
			w: [] as string[], // White pieces captured by Black
			b: [] as string[]  // Black pieces captured by White
		};

		const symbols: Record<string, string> = {
			p: '♟', n: '♞', b: '♝', r: '♜', q: '♛'
		};

		const pieceValues: Record<string, number> = {
			p: 1, n: 3, b: 3, r: 5, q: 9
		};

		let wVal = 0;
		let bVal = 0;

		for (const type of ['p', 'n', 'b', 'r', 'q'] as const) {
			const lostWhite = initial.w[type] - current.w[type];
			for (let i = 0; i < lostWhite; i++) {
				capturedList.w.push(symbols[type]);
				bVal += pieceValues[type];
			}

			const lostBlack = initial.b[type] - current.b[type];
			for (let i = 0; i < lostBlack; i++) {
				capturedList.b.push(symbols[type]);
				wVal += pieceValues[type];
			}
		}

		return {
			captured: capturedList,
			whiteScore: wVal,
			blackScore: bVal
		};
	})();


	// Visual indicators for pieces
	const pieceGlyphs: Record<string, string> = {
		p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚'
	};

	// Derive the board to display: either the live board or a past position
	const isReviewing = viewIndex < moveHistory.length - 1;
	const displayFen = moveHistory[viewIndex] ?? boardFen;
	displayChess.load(displayFen);

	// Grid perspectives
	const ranks = playerColor === 'b' ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
	const files = playerColor === 'b' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

	// Build rendered move history rows with half-move index awareness
	const buildMoveRows = () => {
		// moveHistory[0] = start, moveHistory[1] = after move 1 (white), etc.
		// half-move index i corresponds to moveHistory[i+1] (0-based from history[1])
		const halfMoves = moveHistory.length - 1; // number of half-moves played
		const rows = [];
		for (let i = 0; i < halfMoves; i += 2) {
			rows.push({
				num: Math.floor(i / 2) + 1,
				whiteIdx: i,   // half-move index (0-based)
				blackIdx: i + 1,
				whiteSan: moveSAN[i] ?? '',
				blackSan: moveSAN[i + 1] ?? '',
			});
		}
		return rows;
	};

	return (
		<div className="game-container">
			<LeftSidebar
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				searchResults={searchResults}
				showResults={showResults}
				isSearching={isSearchingUser}
				onUserClick={handleUserClick}
				getStatusDot={getStatusDot}
			/>

			<RightSidebar currentUser={currentUser} />

			<main className="game-main">
				{gameState === 'searching' && (
					<div className="searching-card">
						<div className="searching-pulse">
							<span>♟</span>
						</div>
						<h3>{t('searching_match', 'Searching for opponent...')}</h3>
						<p>{t('searching_desc', 'Filtering by match speed: ')} <strong>{selectedMode}</strong></p>
						<button className="cancel-match-btn" onClick={cancelMatchmaking}>
							{t('cancel', 'Cancel')}
						</button>
					</div>
				)}

				{gameState === 'playing' && (
					<div className="game-play-area">
						{/* Chess Board Area */}
						<div className="board-container">
							{/* Opponent Banner */}
							<div className={`player-banner ${turn !== playerColor ? 'active-turn' : ''} ${(turn !== playerColor && (turn === 'w' ? whiteTime : blackTime) < 15000) ? 'low-time' : ''}`}>
								<div className="player-info">
									<span className={`player-color-dot ${playerColor === 'w' ? 'black' : 'white'}`}></span>
									<span className="player-name">{opponentName}</span>
								</div>
								<div className="game-clock">
									{formatTime(playerColor === 'w' ? blackTime : whiteTime)}
								</div>
							</div>

							{/* Active Board */}
							<div className={`chess-board${isReviewing ? ' reviewing' : ''}`} data-fen={displayFen}>
								{ranks.map((rank, rankIdx) =>
									files.map((file, fileIdx) => {
										const sq = `${file}${rank}`;
										const piece = isReviewing ? displayChess.get(sq as Square) : localChess.get(sq as Square);
										const isLight = (fileIdx + rankIdx) % 2 === 0;
										const isSel = selectedSquare === sq;
										const isValid = validMoves.includes(sq);
										const isLastSrc = lastMove?.from === sq;
										const isLastDst = lastMove?.to === sq;
										const isKingInCheck = isCheck && piece?.type === 'k' && piece?.color === turn;

										return (
											<div
												key={sq}
												onClick={() => handleSquareClick(sq)}
												onDragOver={handleDragOver}
												onDrop={(e) => handleDrop(e, sq)}
												className={`square ${isLight ? 'light' : 'dark'} ${isSel ? 'selected' : ''} ${isLastSrc ? 'last-move-src' : ''} ${isLastDst ? 'last-move-dst' : ''} ${isKingInCheck ? 'check' : ''}`}
											>
												{piece && (
													<span
														className={`piece ${piece.color === 'w' ? 'white' : 'black'}`}
														draggable={true}
														onDragStart={(e) => handleDragStart(e, sq)}
													>
														{pieceGlyphs[piece.type]}
													</span>
												)}
												
												{/* Valid target highlights */}
												{isValid && !piece && <div className="valid-move-dot" />}
												{isValid && piece && <div className="valid-move-capture" />}
											</div>
										);
									})
								)}

								{/* Pawn Promotion Overlay */}
								{showPromotion && (
									<div className="promotion-overlay">
										<div className="promotion-box">
											<h4>{t('promote_pawn', 'Promote Pawn')}</h4>
											<div className="promotion-options">
												<button className="promotion-option" onClick={() => handlePromotionSelect('q')}>♛</button>
												<button className="promotion-option" onClick={() => handlePromotionSelect('r')}>♜</button>
												<button className="promotion-option" onClick={() => handlePromotionSelect('b')}>♝</button>
												<button className="promotion-option" onClick={() => handlePromotionSelect('n')}>♞</button>
											</div>
										</div>
									</div>
								)}

								{/* Disconnection Warning Box */}
								{isPaused && (
									<div className="game-pause-warning">
										<h4>⚠️ {t('opponent_disconnected_title', 'Opponent Disconnected')}</h4>
										<p>{t('opponent_reconnect_wait', 'Waiting for reconnection...')} {pauseCountdown}s</p>
									</div>
								)}
							</div>

							{/* Player self Banner */}
							<div className={`player-banner bottom ${turn === playerColor ? 'active-turn' : ''} ${(turn === playerColor && (turn === 'w' ? whiteTime : blackTime) < 15000) ? 'low-time' : ''}`}>
								<div className="player-info">
									<span className={`player-color-dot ${playerColor === 'w' ? 'white' : 'black'}`}></span>
									<span className="player-name">{currentUser?.username || 'You'}</span>
								</div>
								<div className="game-clock">
									{formatTime(playerColor === 'w' ? whiteTime : blackTime)}
								</div>
							</div>
						</div>

						{/* Side Information Panel */}
						<div className="game-info-panel">
							<div className="panel-header">
								<h3>{t('match_panel', 'Match Control')}</h3>
								<span className={`game-mode-tag ${selectedMode}`}>
									{selectedMode}
								</span>
							</div>

							{/* Captured pieces */}
							<div className="captured-container">
								<span className="captured-label">{t('captured_by_you', 'Captured by You')}</span>
								<div className="captured-list">
									{(playerColor === 'w' ? captured.b : captured.w).map((sym, idx) => (
										<span key={idx} className={`captured-piece ${playerColor === 'w' ? 'black' : 'white'}`}>{sym}</span>
									))}
									{playerColor === 'w' && whiteScore > blackScore && (
										<span className="material-diff">+{whiteScore - blackScore}</span>
									)}
									{playerColor === 'b' && blackScore > whiteScore && (
										<span className="material-diff">+{blackScore - whiteScore}</span>
									)}
								</div>

								<span className="captured-label" style={{ marginTop: '10px' }}>{t('captured_by_opponent', 'Captured by Opponent')}</span>
								<div className="captured-list">
									{(playerColor === 'w' ? captured.w : captured.b).map((sym, idx) => (
										<span key={idx} className={`captured-piece ${playerColor === 'w' ? 'white' : 'black'}`}>{sym}</span>
									))}
									{playerColor === 'w' && blackScore > whiteScore && (
										<span className="material-diff">+{blackScore - whiteScore}</span>
									)}
									{playerColor === 'b' && whiteScore > blackScore && (
										<span className="material-diff">+{whiteScore - blackScore}</span>
									)}
								</div>
							</div>

							{/* Move History Logger */}
							<div className="move-history-container">
								<div className="move-history-header">
									<span className="move-history-title">{t('move_history', 'Move Log')}</span>
									<div className="move-nav-arrows">
										<button title="Start" onClick={() => setViewIndex(0)}>⇤</button>
										<button title="Previous" onClick={() => setViewIndex(v => Math.max(0, v - 1))}>◀</button>
										<button title="Next" onClick={() => setViewIndex(v => Math.min(moveHistory.length - 1, v + 1))}>▶</button>
										<button title="Latest" onClick={() => setViewIndex(moveHistory.length - 1)}>⇥</button>
									</div>
								</div>
								<div className="move-history-list" ref={moveListRef}>
									{buildMoveRows().map((row) => {
										// viewIndex 0 = start (no move active), 1 = white move 1, 2 = black move 1, etc.
										const whiteActive = viewIndex === row.whiteIdx + 1;
										const blackActive = viewIndex === row.blackIdx + 1;
										return (
											<>
												<span className="move-row-num" key={`num-${row.num}`}>{row.num}.</span>
												<span
													key={`w-${row.num}`}
													className={`move-cell${whiteActive ? ' active-move' : ''}`}
													onClick={() => setViewIndex(row.whiteIdx + 1)}
												>{row.whiteSan}</span>
												<span
													key={`b-${row.num}`}
													className={`move-cell${blackActive ? ' active-move' : ''}${!row.blackSan ? ' empty-cell' : ''}`}
													onClick={() => row.blackSan && setViewIndex(row.blackIdx + 1)}
												>{row.blackSan}</span>
											</>
										);
									})}
								</div>
								{isReviewing && (
									<div className="reviewing-banner">👁 Reviewing — not live</div>
								)}
							</div>

							{/* Resign / Resign actions */}
							<div className="game-actions">
								{isGameOver ? (
									<button className="resign-btn" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', borderColor: 'rgba(96, 165, 250, 0.4)' }} onClick={() => navigate('/home')}>
										🏠 {t('back_to_lobby', 'Back to Lobby')}
									</button>
								) : (
									<button className="resign-btn" onClick={resignGame}>
										🏳️ {t('resign', 'Resign')}
									</button>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Game Over Dialog */}
				{isGameOver && !hideGameOverModal && (
					<div className="game-over-modal">
						<div className="game-over-box">
							<button className="close-modal-x" onClick={() => setHideGameOverModal(true)}>✕</button>
							<div className="game-over-icon">
								{winnerColor === playerColor ? '🏆' : winnerColor === null ? '🤝' : '💀'}
							</div>
							<h2>{t('game_over', 'Game Over')}</h2>
							<div className="game-over-result">
								{winnerColor === playerColor ? t('victory', 'Victory!') : winnerColor === null ? t('draw', 'Draw') : t('defeat', 'Defeat')}
							</div>
							<div className="game-over-reason">
								{gameOverReason === 'CHECKMATE' && t('reason_checkmate', 'Checkmate')}
								{gameOverReason === 'STALEMATE' && t('reason_stalemate', 'Stalemate')}
								{gameOverReason === 'TIMEOUT' && t('reason_timeout', 'Time Out')}
								{gameOverReason === 'RESIGNATION' && t('reason_resignation', 'Resigned')}
								{gameOverReason === 'DISCONNECTION' && t('reason_disconnection', 'Opponent Disconnected')}
								{gameOverReason === 'DRAW' && t('reason_draw', 'Draw')}
							</div>
							<button className="play-again-btn" onClick={() => {
								setIsGameOver(false);
								startMatchmaking();
							}}>
								{t('play_again', 'Play Again')}
							</button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
