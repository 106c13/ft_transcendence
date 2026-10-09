import { Chess, Square } from 'chess.js';
import { StockfishService } from './stockfish';

export interface MoveAnalysis {
	ply: number; // 0, 1, 2, ...
	moveNumber: number; // 1, 1, 2, 2, ...
	color: 'w' | 'b';
	san: string;
	from: string;
	to: string;
	fenBefore: string;
	fenAfter: string;
	score: number; // centipawns from White's perspective (+ White, - Black)
	mate: number | null;
	centipawnLoss: number; // CPL >= 0
	winChance: number; // 0 to 100 (White's win chance)
	bestMove: {
		from: string;
		to: string;
		san: string;
	} | null;
	continuation: string[]; // SAN list of best engine moves
	classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
	explanation: string;
	explanationKey?: string;
	explanationParams?: Record<string, any>;
}

export interface GameAnalysisResult {
	accuracy: {
		white: number;
		black: number;
	};
	summary: {
		white: Record<string, number>;
		black: Record<string, number>;
	};
	positions: MoveAnalysis[];
}

const PIECE_VALUES: Record<string, number> = {
	p: 100,
	n: 300,
	b: 320,
	r: 500,
	q: 900,
	k: 0,
};

function centipawnsToWinChance(cp: number): number {
	const winProb = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
	return Math.max(0, Math.min(100, winProb));
}

function uciToSan(fen: string, uciMove: string): { from: string; to: string; san: string } | null {
	if (!uciMove || uciMove.length < 4) return null;
	const from = uciMove.substring(0, 2);
	const to = uciMove.substring(2, 4);
	const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

	try {
		const tempChess = new Chess(fen);
		const move = tempChess.move({ from, to, promotion });
		if (move) {
			return { from, to, san: move.san };
		}
	} catch {}
	return { from, to, san: uciMove };
}

function convertPvToSan(fen: string, pvList: string[]): string[] {
	const result: string[] = [];
	try {
		const tempChess = new Chess(fen);
		for (const uciMove of pvList.slice(0, 4)) {
			if (!uciMove || uciMove.length < 4) break;
			const from = uciMove.substring(0, 2);
			const to = uciMove.substring(2, 4);
			const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
			const move = tempChess.move({ from, to, promotion });
			if (move) {
				result.push(move.san);
			} else {
				break;
			}
		}
	} catch {}
	return result;
}

/**
 * Accurately determines if a move involves a genuine tactical piece sacrifice.
 * Conditions:
 * 1. Piece moved into an attacked square where lower-value piece can capture it,
 *    or piece is hanging (undefended or attackers > defenders).
 * 2. Exchange sacrifice (Rook for minor piece, or minor piece for pawn).
 * 3. Leaving an already-attacked piece en prise elsewhere on the board.
 * 4. Filters out trivial recaptures and standard pawn pushes.
 */
function checkSacrifice(
	replayBefore: Chess,
	replayAfter: Chess,
	move: any,
	prevMove: any | null
): boolean {
	const pieceMoved = move.piece; // 'p', 'n', 'b', 'r', 'q', 'k'
	const opponentColor = move.color === 'w' ? 'b' : 'w';
	const playerColor = move.color;

	// 1. If this is an immediate recapture on the same square where opponent just captured,
	// it is a standard trade/recapture, NOT a sacrifice.
	if (prevMove && prevMove.captured && move.captured && move.to === prevMove.to) {
		const prevCapturedVal = PIECE_VALUES[prevMove.captured] || 0;
		const myCapturedVal = PIECE_VALUES[move.captured] || 0;
		if (myCapturedVal >= prevCapturedVal - 50) {
			return false;
		}
	}

	// 2. Direct Sacrifice / Exchange Sacrifice on the destination square
	const oppCaptures = replayAfter.moves({ verbose: true }).filter((m: any) => m.to === move.to);
	if (oppCaptures.length > 0) {
		const movedVal = PIECE_VALUES[pieceMoved] || 0;
		const capturedVal = move.captured ? (PIECE_VALUES[move.captured] || 0) : 0;
		const netDirectCost = movedVal - capturedVal;

		// A: Piece of value >= 300 moved to a square where an opponent piece of LOWER value can take it
		// (e.g. Pawn captures Queen/Rook/Minor, or Minor captures Queen/Rook)
		for (const oppCap of oppCaptures) {
			const oppPieceVal = PIECE_VALUES[oppCap.piece] || 0;
			if (movedVal >= 300 && oppPieceVal < movedVal) {
				return true;
			}
		}

		// B: Piece of value >= 300 moved to a square where it is completely undefended (hanging)
		const isDefended = replayAfter.isAttacked(move.to as Square, playerColor);
		if (!isDefended && movedVal >= 300) {
			return true;
		}

		// C: Exchange sacrifice (e.g. Rook takes minor piece, net loss >= 150)
		if (netDirectCost >= 150) {
			return true;
		}
	}

	// 3. Hanging Piece Left Behind (counter-attack / deflection)
	// Check if player had another piece (Knight, Bishop, Rook, Queen) attacked before the move,
	// and instead of saving it, ignored the attack and let opponent legally take it next move.
	const boardBefore = replayBefore.board();
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const piece = boardBefore[r][c];
			if (!piece || piece.color !== playerColor || piece.type === 'p' || piece.type === 'k') continue;
			const sq = piece.square;
			if (sq === move.from || sq === move.to) continue;

			const pieceVal = PIECE_VALUES[piece.type] || 0;
			if (replayBefore.isAttacked(sq, opponentColor)) {
				const oppLegalTakes = replayAfter.moves({ verbose: true }).filter((m: any) => m.to === sq);
				if (oppLegalTakes.length > 0) {
					const isStillDefended = replayAfter.isAttacked(sq, playerColor);
					for (const take of oppLegalTakes) {
						const takeAttackerVal = PIECE_VALUES[take.piece] || 0;
						if (takeAttackerVal < pieceVal || !isStillDefended) {
							return true;
						}
					}
				}
			}
		}
	}

	return false;
}

export class GameAnalyzer {
	private stockfish: StockfishService;

	constructor(stockfish: StockfishService) {
		this.stockfish = stockfish;
	}

	async analyzeGame(pgn: string, depth: number = 15): Promise<GameAnalysisResult> {
		const chess = new Chess();
		try {
			chess.loadPgn(pgn);
		} catch {}

		const history = chess.history({ verbose: true });
		const replay = new Chess();

		const positions: MoveAnalysis[] = [];

		const summary = {
			white: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
			black: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
		};

		let whiteAccuracySum = 0;
		let whiteMoveCount = 0;
		let blackAccuracySum = 0;
		let blackMoveCount = 0;

		for (let i = 0; i < history.length; i++) {
			const move = history[i];
			const prevMove = i > 0 ? history[i - 1] : null;
			const fenBefore = replay.fen();
			const playerColor = move.color; // 'w' | 'b'
			const moveNumber = Math.floor(i / 2) + 1;

			// Clone state before move for tactical sacrifice analysis
			const replayBefore = new Chess(fenBefore);

			// 1. Evaluate position BEFORE the move
			const evalBefore = await this.stockfish.evaluatePosition(fenBefore, depth);
			const bestMoveSanObj = uciToSan(fenBefore, evalBefore.bestMove);
			const bestContinuationSan = convertPvToSan(fenBefore, evalBefore.pv);

			// Apply the player's move
			replay.move(move);
			const fenAfter = replay.fen();

			// Check for terminal positions directly
			const isCheckmate = replay.isCheckmate();
			const isStalemate = replay.isStalemate();
			const isDraw = replay.isDraw();

			const isSacrifice = checkSacrifice(replayBefore, replay, move, prevMove);

			// Checkmate handling:
			if (isCheckmate) {
				const scoreWhitePerspective = playerColor === 'w' ? 10000 : -10000;
				const winChanceWhite = playerColor === 'w' ? 100 : 0;
				const classification: 'brilliant' | 'best' = isSacrifice ? 'brilliant' : 'best';
				const explanationKey = isSacrifice ? 'expl_brilliant' : 'expl_checkmate';
				const explanation = isSacrifice
					? 'A brilliant move involving a tactical piece sacrifice while delivering checkmate!'
					: 'Checkmate! A decisive finish.';

				positions.push({
					ply: i,
					moveNumber,
					color: playerColor,
					san: move.san,
					from: move.from,
					to: move.to,
					fenBefore,
					fenAfter,
					score: scoreWhitePerspective,
					mate: 0,
					centipawnLoss: 0,
					winChance: winChanceWhite,
					bestMove: null,
					continuation: [],
					classification,
					explanation,
					explanationKey,
					explanationParams: {},
				});

				const colorKey = playerColor === 'w' ? 'white' : 'black';
				summary[colorKey][classification]++;
				if (playerColor === 'w') {
					whiteAccuracySum += 100;
					whiteMoveCount++;
				} else {
					blackAccuracySum += 100;
					blackMoveCount++;
				}

				console.log(
					`[Stockfish] Move ${moveNumber}${playerColor === 'w' ? '.' : '...'} ${move.san.padEnd(5)} | CPL:    0 cp | Eval: Checkmate (${playerColor === 'w' ? '1-0' : '0-1'}) | Quality: ${classification.toUpperCase()}`
				);
				continue;
			}

			// Terminal draw / stalemate handling:
			if (isStalemate || isDraw) {
				const scoreWhitePerspective = 0;
				const winChanceWhite = 50;
				const bestEvalFromPlayer = playerColor === 'w' ? evalBefore.score : -evalBefore.score;
				const centipawnLoss = Math.max(0, bestEvalFromPlayer);
				const classification = centipawnLoss > 200 ? 'blunder' : centipawnLoss > 80 ? 'mistake' : 'best';

				positions.push({
					ply: i,
					moveNumber,
					color: playerColor,
					san: move.san,
					from: move.from,
					to: move.to,
					fenBefore,
					fenAfter,
					score: scoreWhitePerspective,
					mate: null,
					centipawnLoss: Math.round(centipawnLoss),
					winChance: winChanceWhite,
					bestMove: null,
					continuation: [],
					classification,
					explanation: isStalemate ? 'Stalemate! Game drawn.' : 'Draw by chess rules.',
					explanationKey: isStalemate ? 'expl_stalemate' : 'expl_draw',
					explanationParams: {},
				});

				const colorKey = playerColor === 'w' ? 'white' : 'black';
				summary[colorKey][classification]++;
				const moveAccuracy = Math.max(0, Math.min(100, Math.round((100 * Math.exp(-0.0035 * centipawnLoss)) * 10) / 10));
				if (playerColor === 'w') {
					whiteAccuracySum += moveAccuracy;
					whiteMoveCount++;
				} else {
					blackAccuracySum += moveAccuracy;
					blackMoveCount++;
				}
				continue;
			}

			// 2. Evaluate position AFTER the move
			const evalAfter = await this.stockfish.evaluatePosition(fenAfter, depth);

			// Normalize scores from moving player's perspective
			const bestEvalFromPlayer = playerColor === 'w' ? evalBefore.score : -evalBefore.score;
			const playedEvalFromPlayer = playerColor === 'w' ? evalAfter.score : -evalAfter.score;

			const rawCpl = bestEvalFromPlayer - playedEvalFromPlayer;

			const isPlayedMoveBest = !!(bestMoveSanObj && (
				bestMoveSanObj.san === move.san ||
				(bestMoveSanObj.from === move.from && bestMoveSanObj.to === move.to)
			));

			// 3. Centipawn Loss (CPL) pinning & refinement
			let centipawnLoss = 0;
			if (isPlayedMoveBest || (moveNumber <= 2 && rawCpl <= 35)) {
				// Pin CPL to 0 if player played the engine's best move or standard opening book
				centipawnLoss = 0;
			} else if (evalBefore.mate !== null && evalAfter.mate !== null) {
				const myBeforeMate = playerColor === 'w' ? evalBefore.mate : -evalBefore.mate;
				const myAfterMate = playerColor === 'w' ? evalAfter.mate : -evalAfter.mate;
				if (myBeforeMate > 0 && myAfterMate > 0) {
					const delayed = myAfterMate - (myBeforeMate - 1);
					centipawnLoss = Math.max(0, delayed * 40);
				} else {
					centipawnLoss = Math.max(0, rawCpl);
				}
			} else if (evalBefore.mate !== null && evalAfter.mate === null) {
				const myBeforeMate = playerColor === 'w' ? evalBefore.mate : -evalBefore.mate;
				if (myBeforeMate > 0) {
					centipawnLoss = Math.max(250, rawCpl);
				} else {
					centipawnLoss = Math.max(0, rawCpl);
				}
			} else {
				centipawnLoss = Math.max(0, rawCpl);
			}

			const scoreWhitePerspective = evalAfter.score;
			const winChanceWhite = centipawnsToWinChance(scoreWhitePerspective);

			// 4. Move accuracy %
			const moveAccuracy = Math.max(0, Math.min(100, Math.round((100 * Math.exp(-0.0035 * centipawnLoss)) * 10) / 10));
			if (playerColor === 'w') {
				whiteAccuracySum += moveAccuracy;
				whiteMoveCount++;
			} else {
				blackAccuracySum += moveAccuracy;
				blackMoveCount++;
			}

			// 5. Great Move determination
			const isGreatMove = !isSacrifice && (isPlayedMoveBest || centipawnLoss <= 5) &&
				moveNumber > 2 &&
				bestEvalFromPlayer >= -100 && bestEvalFromPlayer <= 550 &&
				(!move.captured || (prevMove && !prevMove.captured)) &&
				(move.san.includes('+') || playedEvalFromPlayer >= bestEvalFromPlayer + 40 || (bestEvalFromPlayer < 100 && playedEvalFromPlayer >= 150));

			// 6. Classification based on CPL, sacrifice, and sharpness
			let classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' = 'best';
			let explanation = '';
			let explanationKey = '';
			let explanationParams: Record<string, any> = {};

			const isForcedMate = evalAfter.mate !== null && (playerColor === 'w' ? evalAfter.mate > 0 : evalAfter.mate < 0);
			const hadForcedMateBefore = evalBefore.mate !== null && (playerColor === 'w' ? evalBefore.mate > 0 : evalBefore.mate < 0);
			const isMatingSac = isForcedMate || (hadForcedMateBefore && centipawnLoss <= 15);
			const isWinningWithSac = playedEvalFromPlayer >= 150 || isForcedMate;

			if (isSacrifice && centipawnLoss <= 15 && isWinningWithSac && (isMatingSac || bestEvalFromPlayer <= 700)) {
				classification = 'brilliant';
				explanationKey = 'expl_brilliant';
				explanation = 'A brilliant move involving a tactical piece sacrifice while keeping a winning advantage!';
			} else if (isGreatMove) {
				classification = 'great';
				explanationKey = 'expl_great';
				explanation = 'A great find! The only move that maintains the advantage.';
			} else if (centipawnLoss <= 8 || isPlayedMoveBest) {
				classification = 'best';
				explanationKey = 'expl_best';
				explanation = 'The best move in this position.';
			} else if (centipawnLoss <= 25) {
				classification = 'excellent';
				explanationKey = 'expl_excellent';
				explanation = 'An excellent and solid move.';
			} else if (centipawnLoss <= 60) {
				classification = 'good';
				explanationKey = 'expl_good';
				explanation = 'A good, natural move.';
			} else if (centipawnLoss <= 150) {
				classification = 'inaccuracy';
				if (bestMoveSanObj) {
					explanationKey = 'expl_inaccuracy_better';
					explanationParams = { cp: Math.round(centipawnLoss), bestSan: bestMoveSanObj.san };
					explanation = `An inaccuracy (lost ${Math.round(centipawnLoss)} cp). Better was ${bestMoveSanObj.san}.`;
				} else {
					explanationKey = 'expl_inaccuracy';
					explanationParams = { cp: Math.round(centipawnLoss) };
					explanation = `An inaccuracy (lost ${Math.round(centipawnLoss)} cp).`;
				}
			} else if (centipawnLoss <= 300) {
				classification = 'mistake';
				if (bestMoveSanObj) {
					explanationKey = 'expl_mistake_better';
					explanationParams = { cp: Math.round(centipawnLoss), bestSan: bestMoveSanObj.san };
					explanation = `A mistake (lost ${Math.round(centipawnLoss)} cp). The best continuation was ${bestMoveSanObj.san}.`;
				} else {
					explanationKey = 'expl_mistake';
					explanationParams = { cp: Math.round(centipawnLoss) };
					explanation = `A mistake (lost ${Math.round(centipawnLoss)} cp) that worsens your position.`;
				}
			} else {
				classification = 'blunder';
				if (bestMoveSanObj) {
					explanationKey = 'expl_blunder_better';
					explanationParams = { cp: Math.round(centipawnLoss), bestSan: bestMoveSanObj.san };
					explanation = `A blunder (lost ${Math.round(centipawnLoss)} cp). Overlooked ${bestMoveSanObj.san} which keeps the advantage.`;
				} else {
					explanationKey = 'expl_blunder';
					explanationParams = { cp: Math.round(centipawnLoss) };
					explanation = `A critical blunder (lost ${Math.round(centipawnLoss)} cp) that loses significant advantage.`;
				}
			}

			const colorKey = playerColor === 'w' ? 'white' : 'black';
			summary[colorKey][classification]++;

			positions.push({
				ply: i,
				moveNumber,
				color: playerColor,
				san: move.san,
				from: move.from,
				to: move.to,
				fenBefore,
				fenAfter,
				score: scoreWhitePerspective,
				mate: evalAfter.mate,
				centipawnLoss: Math.round(centipawnLoss),
				winChance: Math.round(winChanceWhite * 10) / 10,
				bestMove: bestMoveSanObj,
				continuation: bestContinuationSan,
				classification,
				explanation,
				explanationKey,
				explanationParams,
			});

			console.log(
				`[Stockfish] Move ${moveNumber}${playerColor === 'w' ? '.' : '...'} ${move.san.padEnd(5)} | CPL: ${String(Math.round(centipawnLoss)).padStart(4)} cp | Eval: ${evalAfter.mate !== null ? ('M' + evalAfter.mate).padEnd(6) : ((scoreWhitePerspective / 100).toFixed(2)).padEnd(6)} | Best: ${(bestMoveSanObj?.san || '-').padEnd(6)} | Quality: ${classification.toUpperCase()}`
			);
		}

		const whiteAccuracy = whiteMoveCount > 0 ? Math.round((whiteAccuracySum / whiteMoveCount) * 10) / 10 : 100;
		const blackAccuracy = blackMoveCount > 0 ? Math.round((blackAccuracySum / blackMoveCount) * 10) / 10 : 100;

		return {
			accuracy: {
				white: whiteAccuracy,
				black: blackAccuracy,
			},
			summary,
			positions,
		};
	}
}
