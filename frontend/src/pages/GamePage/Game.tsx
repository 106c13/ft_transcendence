import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import io, { Socket } from 'socket.io-client';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import styles from './Game.module.css';

interface Premove {
    from: string;
    to: string;
    promotion?: string;
}

const getSimulatedChess = (baseFen: string, color: 'w' | 'b' | null, premoveList: Premove[]) => {
    const sim = new Chess(baseFen);
    if (!color || premoveList.length === 0) return sim;

    for (const pm of premoveList) {
        const tokens = sim.fen().split(' ');
        tokens[1] = color;
        sim.load(tokens.join(' '));
        try {
            sim.move({ from: pm.from, to: pm.to, promotion: pm.promotion || 'q' });
        } catch {
            break;
        }
    }
    return sim;
};

const getValidMovesForSquare = (simChess: Chess, square: string, color: 'w' | 'b') => {
    const temp = new Chess(simChess.fen());
    const tokens = temp.fen().split(' ');
    tokens[1] = color;
    temp.load(tokens.join(' '));
    try {
        const moves = temp.moves({ square: square as Square, verbose: true });
        return moves.map(m => m.to);
    } catch {
        return [];
    }
};

// ---------------------------------------------------------------------------
// SVG piece asset resolution
// ---------------------------------------------------------------------------
// Update PIECE_ASSET_DIR / the filename pattern below to match whatever your
// downloaded SVG set is actually named. This is the ONLY place piece image
// paths are constructed, so changing your file naming only requires editing
// this one function.
//
// Assumed layout (Lichess "cburnett"-style naming), served from /public:
//   public/assets/pieces/wP.svg  wN.svg  wB.svg  wR.svg  wQ.svg  wK.svg
//   public/assets/pieces/bP.svg  bN.svg  bB.svg  bR.svg  bQ.svg  bK.svg
const PIECE_ASSET_DIR = '/assets/pieces';

const getPieceImageSrc = (type: string, color: 'w' | 'b'): string => {
    return `${PIECE_ASSET_DIR}/${color}${type.toUpperCase()}.svg`;
};

const PIECE_NAME: Record<string, string> = {
    p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King',
};

const modeTagClassMap: Record<string, keyof typeof styles> = {
    'bullet': 'bullet',
    'bullet+2': 'bulletInc',
    'blitz': 'blitz',
    'blitz+2': 'blitzInc',
    'rapid': 'rapid',
    'rapid+2': 'rapidInc',
};

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

    // Premove States & Refs
    const [premoves, setPremoves] = useState<Premove[]>([]);
    const [pendingPremove, setPendingPremove] = useState<Premove | null>(null);

    const premovesRef = useRef<Premove[]>([]);
    premovesRef.current = premoves;
    const playerColorRef = useRef<'w' | 'b'>(playerColor);
    playerColorRef.current = playerColor;
    const gameIdRef = useRef<string>(gameId);
    gameIdRef.current = gameId;

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

    // ---------------------------------------------------------------------
    // Preload piece SVGs so drag/drop and the promotion overlay never flash
    // an empty image on first paint.
    // ---------------------------------------------------------------------
    useEffect(() => {
        const colors: Array<'w' | 'b'> = ['w', 'b'];
        const types = ['p', 'n', 'b', 'r', 'q', 'k'];
        for (const color of colors) {
            for (const type of types) {
                const img = new Image();
                img.src = getPieceImageSrc(type, color);
            }
        }
    }, []);

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
            setPremoves([]);
            // Reset history — if resuming, load existing moves as snapshots
            const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const historyFens: string[] = [startFen];
            if (data.history && data.history.length > 0) {
                const replayChess = new Chess();
                for (const san of data.history) {
                    try { replayChess.move(san); } catch { }
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

            // Process Premoves if it's now our turn
            if (data.turn === playerColorRef.current && premovesRef.current.length > 0) {
                const nextPremove = premovesRef.current[0];
                const testChess = new Chess(data.fen);
                let validMove = null;
                try {
                    validMove = testChess.move({
                        from: nextPremove.from,
                        to: nextPremove.to,
                        promotion: nextPremove.promotion || 'q',
                    });
                } catch { }

                if (validMove) {
                    if (socketRef.current && gameIdRef.current) {
                        socketRef.current.emit('make_move', {
                            gameId: gameIdRef.current,
                            from: nextPremove.from,
                            to: nextPremove.to,
                            promotion: nextPremove.promotion,
                        });
                    }
                    setPremoves(prev => prev.slice(1));
                } else {
                    setPremoves([]);
                }
            }
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
            setPremoves([]);
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
            const active = moveListRef.current.querySelector(`.${styles.moveCell}.${styles.activeMove}`);
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
        if (gameState !== 'playing' || isGameOver || isPaused || isReviewing) {
            e.preventDefault();
            return;
        }

        const simChess = getSimulatedChess(boardFen, playerColor, premoves);
        const piece = simChess.get(square as Square);
        if (!piece || piece.color !== playerColor) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData('text/plain', square);
        e.dataTransfer.effectAllowed = 'move';

        setSelectedSquare(square);
        const targets = getValidMovesForSquare(simChess, square, playerColor);
        setValidMoves(targets);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    const handleDrop = (e: React.DragEvent, targetSquare: string) => {
        e.preventDefault();
        const sourceSquare = e.dataTransfer.getData('text/plain');

        if (sourceSquare && sourceSquare !== targetSquare) {
            if (validMoves.includes(targetSquare)) {
                const simChess = getSimulatedChess(boardFen, playerColor, premoves);
                const selectedPiece = simChess.get(sourceSquare as Square);
                const isPawn = selectedPiece?.type === 'p';
                const isPromotionRank = targetSquare.endsWith('8') || targetSquare.endsWith('1');

                const isRealTurn = turn === playerColor && premoves.length === 0;

                if (isPawn && isPromotionRank) {
                    if (isRealTurn) {
                        setPendingMove({ from: sourceSquare, to: targetSquare });
                    } else {
                        setPendingPremove({ from: sourceSquare, to: targetSquare });
                    }
                    setShowPromotion(true);
                } else {
                    if (isRealTurn) {
                        sendMove(sourceSquare, targetSquare);
                    } else {
                        setPremoves(prev => [...prev, { from: sourceSquare, to: targetSquare }]);
                        setSelectedSquare(null);
                        setValidMoves([]);
                    }
                }
            } else {
                setSelectedSquare(null);
                setValidMoves([]);
            }
        }
    };

    const handleSquareClick = (square: string) => {
        if (gameState !== 'playing' || isGameOver || isPaused || isReviewing) return;

        const simChess = getSimulatedChess(boardFen, playerColor, premoves);
        const piece = simChess.get(square as Square);

        // If a piece belonging to the player is clicked, select it
        if (piece && piece.color === playerColor) {
            setSelectedSquare(square);
            const targets = getValidMovesForSquare(simChess, square, playerColor);
            setValidMoves(targets);
            return;
        }

        // Check if clicked square is in valid move list
        if (selectedSquare && validMoves.includes(square)) {
            const selectedPiece = simChess.get(selectedSquare as Square);
            const isPawn = selectedPiece?.type === 'p';
            const isPromotionRank = square.endsWith('8') || square.endsWith('1');

            const isRealTurn = turn === playerColor && premoves.length === 0;

            if (isPawn && isPromotionRank) {
                if (isRealTurn) {
                    setPendingMove({ from: selectedSquare, to: square });
                } else {
                    setPendingPremove({ from: selectedSquare, to: square });
                }
                setShowPromotion(true);
            } else {
                if (isRealTurn) {
                    sendMove(selectedSquare, square);
                } else {
                    setPremoves(prev => [...prev, { from: selectedSquare, to: square }]);
                    setSelectedSquare(null);
                    setValidMoves([]);
                }
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
        if (pendingPremove) {
            setPremoves(prev => [...prev, { ...pendingPremove, promotion: pieceCode }]);
            setPendingPremove(null);
            setShowPromotion(false);
            setSelectedSquare(null);
            setValidMoves([]);
        } else if (pendingMove) {
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

        // Calculate difference — each entry stores the piece type + color so
        // the render layer can resolve the correct SVG.
        const capturedList = {
            w: [] as Array<{ type: string; color: 'w' | 'b' }>, // White pieces captured by Black
            b: [] as Array<{ type: string; color: 'w' | 'b' }>  // Black pieces captured by White
        };

        const pieceValues: Record<string, number> = {
            p: 1, n: 3, b: 3, r: 5, q: 9
        };

        let wVal = 0;
        let bVal = 0;

        for (const type of ['p', 'n', 'b', 'r', 'q'] as const) {
            const lostWhite = initial.w[type] - current.w[type];
            for (let i = 0; i < lostWhite; i++) {
                capturedList.w.push({ type, color: 'w' });
                bVal += pieceValues[type];
            }

            const lostBlack = initial.b[type] - current.b[type];
            for (let i = 0; i < lostBlack; i++) {
                capturedList.b.push({ type, color: 'b' });
                wVal += pieceValues[type];
            }
        }

        return {
            captured: capturedList,
            whiteScore: wVal,
            blackScore: bVal
        };
    })();

    // Derive the board to display: either the live board, premoved board, or a past position
    const isReviewing = viewIndex < moveHistory.length - 1;
    const displayFen = useMemo(() => {
        if (isReviewing) return moveHistory[viewIndex] ?? boardFen;
        if (premoves.length > 0 && playerColor) {
            return getSimulatedChess(boardFen, playerColor, premoves).fen();
        }
        return boardFen;
    }, [isReviewing, viewIndex, moveHistory, boardFen, premoves, playerColor]);

    displayChess.load(displayFen);

    const premoveSquares = useMemo(() => {
        const set = new Set<string>();
        for (const pm of premoves) {
            set.add(pm.from);
            set.add(pm.to);
        }
        return set;
    }, [premoves]);

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
        <div className={styles.gameContainer}>
            <main className={styles.gameMain}>
                {gameState === 'searching' && (
                    <div className={styles.searchingCard}>
                        <div className={styles.searchingPulse}>
                            <img
                                src={getPieceImageSrc('p', 'w')}
                                alt=""
                                className={styles.searchingPulseIcon}
                            />
                        </div>
                        <h3>{t('searching_match', 'Searching for opponent...')}</h3>
                        <p>{t('searching_desc', 'Filtering by match speed: ')} <strong>{selectedMode}</strong></p>
                        <button className={styles.cancelMatchBtn} onClick={cancelMatchmaking}>
                            {t('cancel', 'Cancel')}
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className={styles.gamePlayArea}>
                        {/* Chess Board Area */}
                        <div
                            className={styles.boardContainer}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setPremoves([]);
                            }}
                        >
                            {/* Opponent Banner */}
                            <div className={`${styles.playerBanner} ${turn !== playerColor ? styles.activeTurn : ''} ${(turn !== playerColor && (turn === 'w' ? whiteTime : blackTime) < 15000) ? styles.lowTime : ''}`}>
                                <div className={styles.playerInfo}>
                                    <span className={`${styles.playerColorDot} ${playerColor === 'w' ? styles.black : styles.white}`}></span>
                                    <span className={styles.playerName}>{opponentName}</span>
                                </div>
                                <div className={styles.gameClock}>
                                    {formatTime(playerColor === 'w' ? blackTime : whiteTime)}
                                </div>
                            </div>

                            {/* Active Board */}
                            <div className={`${styles.chessBoard}${isReviewing ? ` ${styles.reviewing}` : ''}`} data-fen={displayFen}>
                                {ranks.map((rank, rankIdx) =>
                                    files.map((file, fileIdx) => {
                                        const sq = `${file}${rank}`;
                                        const piece = displayChess.get(sq as Square);
                                        const isLight = (fileIdx + rankIdx) % 2 === 0;
                                        const isSel = selectedSquare === sq;
                                        const isValid = validMoves.includes(sq);
                                        const isLastSrc = lastMove?.from === sq;
                                        const isLastDst = lastMove?.to === sq;
                                        const isPremoveSq = !isReviewing && premoveSquares.has(sq);
                                        const isKingInCheck = isCheck && piece?.type === 'k' && piece?.color === turn;

                                        return (
                                            <div
                                                key={sq}
                                                onClick={() => handleSquareClick(sq)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, sq)}
                                                className={`${styles.square} ${isLight ? styles.light : styles.dark} ${isSel ? styles.selected : ''} ${isPremoveSq ? styles.premove : ''} ${isLastSrc ? styles.lastMoveSrc : ''} ${isLastDst ? styles.lastMoveDst : ''} ${isKingInCheck ? styles.check : ''}`}
                                            >
                                                {piece && (
                                                    <img
                                                        src={getPieceImageSrc(piece.type, piece.color)}
                                                        alt={`${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAME[piece.type]}`}
                                                        className={`${styles.piece} ${piece.color === 'w' ? styles.white : styles.black}`}
                                                        draggable={true}
                                                        onDragStart={(e) => handleDragStart(e, sq)}
                                                    />
                                                )}

                                                {/* Valid target highlights */}
                                                {isValid && !piece && <div className={styles.validMoveDot} />}
                                                {isValid && piece && <div className={styles.validMoveCapture} />}
                                            </div>
                                        );
                                    })
                                )}

                                {/* Pawn Promotion Overlay */}
                                {showPromotion && (
                                    <div className={styles.promotionOverlay}>
                                        <div className={styles.promotionBox}>
                                            <h4>{t('promote_pawn', 'Promote Pawn')}</h4>
                                            <div className={styles.promotionOptions}>
                                                {(['q', 'r', 'b', 'n'] as const).map((code) => (
                                                    <button
                                                        key={code}
                                                        className={styles.promotionOption}
                                                        onClick={() => handlePromotionSelect(code)}
                                                    >
                                                        <img
                                                            src={getPieceImageSrc(code, playerColor)}
                                                            alt={PIECE_NAME[code]}
                                                            className={styles.promotionPieceIcon}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Disconnection Warning Box */}
                                {isPaused && (
                                    <div className={styles.gamePauseWarning}>
                                        <h4>⚠️ {t('opponent_disconnected_title', 'Opponent Disconnected')}</h4>
                                        <p>{t('opponent_reconnect_wait', 'Waiting for reconnection...')} {pauseCountdown}s</p>
                                    </div>
                                )}
                            </div>

                            {/* Player self Banner */}
                            <div className={`${styles.playerBanner} ${styles.bottom} ${turn === playerColor ? styles.activeTurn : ''} ${(turn === playerColor && (turn === 'w' ? whiteTime : blackTime) < 15000) ? styles.lowTime : ''}`}>
                                <div className={styles.playerInfo}>
                                    <span className={`${styles.playerColorDot} ${playerColor === 'w' ? styles.white : styles.black}`}></span>
                                    <span className={styles.playerName}>{currentUser?.username || 'You'}</span>
                                </div>
                                <div className={styles.gameClock}>
                                    {formatTime(playerColor === 'w' ? whiteTime : blackTime)}
                                </div>
                            </div>
                        </div>

                        {/* Side Information Panel */}
                        <div className={styles.gameInfoPanel}>
                            <div className={styles.panelHeader}>
                                <h3>{t('match_panel', 'Match Control')}</h3>
                                <span className={`${styles.gameModeTag} ${styles[modeTagClassMap[selectedMode] || 'blitz']}`}>
                                    {selectedMode}
                                </span>
                            </div>

                            {/* Captured pieces */}
                            <div className={styles.capturedContainer}>
                                <span className={styles.capturedLabel}>{t('captured_by_you', 'Captured by You')}</span>
                                <div className={styles.capturedList}>
                                    {(playerColor === 'w' ? captured.b : captured.w).map((p, idx) => (
                                        <img
                                            key={idx}
                                            src={getPieceImageSrc(p.type, p.color)}
                                            alt={PIECE_NAME[p.type]}
                                            className={`${styles.capturedPiece} ${p.color === 'w' ? styles.white : styles.black}`}
                                        />
                                    ))}
                                    {playerColor === 'w' && whiteScore > blackScore && (
                                        <span className={styles.materialDiff}>+{whiteScore - blackScore}</span>
                                    )}
                                    {playerColor === 'b' && blackScore > whiteScore && (
                                        <span className={styles.materialDiff}>+{blackScore - whiteScore}</span>
                                    )}
                                </div>

                                <span className={styles.capturedLabel} style={{ marginTop: '10px' }}>{t('captured_by_opponent', 'Captured by Opponent')}</span>
                                <div className={styles.capturedList}>
                                    {(playerColor === 'w' ? captured.w : captured.b).map((p, idx) => (
                                        <img
                                            key={idx}
                                            src={getPieceImageSrc(p.type, p.color)}
                                            alt={PIECE_NAME[p.type]}
                                            className={`${styles.capturedPiece} ${p.color === 'w' ? styles.white : styles.black}`}
                                        />
                                    ))}
                                    {playerColor === 'w' && blackScore > whiteScore && (
                                        <span className={styles.materialDiff}>+{blackScore - whiteScore}</span>
                                    )}
                                    {playerColor === 'b' && whiteScore > blackScore && (
                                        <span className={styles.materialDiff}>+{whiteScore - blackScore}</span>
                                    )}
                                </div>
                            </div>

                            {/* Move History Logger */}
                            <div className={styles.moveHistoryContainer}>
                                <div className={styles.moveHistoryHeader}>
                                    <span className={styles.moveHistoryTitle}>{t('move_history', 'Move Log')}</span>
                                    <div className={styles.moveNavArrows}>
                                        <button title="Start" onClick={() => setViewIndex(0)}>⇤</button>
                                        <button title="Previous" onClick={() => setViewIndex(v => Math.max(0, v - 1))}>◀</button>
                                        <button title="Next" onClick={() => setViewIndex(v => Math.min(moveHistory.length - 1, v + 1))}>▶</button>
                                        <button title="Latest" onClick={() => setViewIndex(moveHistory.length - 1)}>⇥</button>
                                    </div>
                                </div>
                                <div className={styles.moveHistoryList} ref={moveListRef}>
                                    {buildMoveRows().map((row) => {
                                        // viewIndex 0 = start (no move active), 1 = white move 1, 2 = black move 1, etc.
                                        const whiteActive = viewIndex === row.whiteIdx + 1;
                                        const blackActive = viewIndex === row.blackIdx + 1;
                                        return (
                                            <>
                                                <span className={styles.moveRowNum} key={`num-${row.num}`}>{row.num}.</span>
                                                <span
                                                    key={`w-${row.num}`}
                                                    className={`${styles.moveCell}${whiteActive ? ` ${styles.activeMove}` : ''}`}
                                                    onClick={() => setViewIndex(row.whiteIdx + 1)}
                                                >{row.whiteSan}</span>
                                                <span
                                                    key={`b-${row.num}`}
                                                    className={`${styles.moveCell}${blackActive ? ` ${styles.activeMove}` : ''}${!row.blackSan ? ` ${styles.emptyCell}` : ''}`}
                                                    onClick={() => row.blackSan && setViewIndex(row.blackIdx + 1)}
                                                >{row.blackSan}</span>
                                            </>
                                        );
                                    })}
                                </div>
                                {isReviewing && (
                                    <div className={styles.reviewingBanner}>👁 Reviewing — not live</div>
                                )}
                            </div>

                            {/* Resign / Resign actions */}
                            <div className={styles.gameActions}>
                                {isGameOver ? (
                                    <button className={styles.resignBtn} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', borderColor: 'rgba(96, 165, 250, 0.4)' }} onClick={() => navigate('/home')}>
                                        🏠 {t('back_to_lobby', 'Back to Lobby')}
                                    </button>
                                ) : (
                                    <button className={styles.resignBtn} onClick={resignGame}>
                                        🏳️ {t('resign', 'Resign')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Game Over Dialog */}
                {isGameOver && !hideGameOverModal && (
                    <div className={styles.gameOverModal}>
                        <div className={styles.gameOverBox}>
                            <button className={styles.closeModalX} onClick={() => setHideGameOverModal(true)}>✕</button>
                            <div className={styles.gameOverIcon}>
                                {winnerColor === playerColor ? '🏆' : winnerColor === null ? '🤝' : '💀'}
                            </div>
                            <h2>{t('game_over', 'Game Over')}</h2>
                            <div className={styles.gameOverResult}>
                                {winnerColor === playerColor ? t('victory', 'Victory!') : winnerColor === null ? t('draw', 'Draw') : t('defeat', 'Defeat')}
                            </div>
                            <div className={styles.gameOverReason}>
                                {gameOverReason === 'CHECKMATE' && t('reason_checkmate', 'Checkmate')}
                                {gameOverReason === 'STALEMATE' && t('reason_stalemate', 'Stalemate')}
                                {gameOverReason === 'TIMEOUT' && t('reason_timeout', 'Time Out')}
                                {gameOverReason === 'RESIGNATION' && t('reason_resignation', 'Resigned')}
                                {gameOverReason === 'DISCONNECTION' && t('reason_disconnection', 'Opponent Disconnected')}
                                {gameOverReason === 'DRAW' && t('reason_draw', 'Draw')}
                            </div>
                            <button className={styles.playAgainBtn} onClick={() => {
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