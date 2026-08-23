import { Chess } from 'chess.js';
import { StockfishService, EvalResult } from './stockfish';

export interface MoveAnalysis {
	ply: number; // 0, 1, 2, ...
	moveNumber: number; // 1, 1, 2, 2, ...
	color: 'w' | 'b';
	san: string;
	from: string;
	to: string;
	fenBefore: string;
	fenAfter: string;
	score: number; // centipawns from White's perspective
	mate: number | null;
	winChance: number; // 0 to 100 (White's win chance)
	bestMove: {
		from: string;
		to: string;
		san: string;
	} | null;
	continuation: string[]; // SAN list of best engine moves
	classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
	explanation: string;
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

function centipawnsToWinChance(cp: number): number {
	// Lichess sigmoid win probability formula
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

export class GameAnalyzer {
	private stockfish: StockfishService;

	constructor(stockfish: StockfishService) {
		this.stockfish = stockfish;
	}

	async analyzeGame(pgn: string, depth: number = 12): Promise<GameAnalysisResult> {
		const chess = new Chess();
		try {
			chess.loadPgn(pgn);
		} catch {
			// If pgn parsing fails, try loading as move text
		}

		const history = chess.history({ verbose: true });
		const replay = new Chess();

		const initialFen = replay.fen();
		const initialEval = await this.stockfish.evaluatePosition(initialFen, depth);
		let prevScore = initialEval.score;
		let prevWinChance = centipawnsToWinChance(prevScore);

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
			const fenBefore = replay.fen();

			// Apply move
			replay.move(move);
			const fenAfter = replay.fen();

			// Evaluate the position after the move
			const evalResult = await this.stockfish.evaluatePosition(fenAfter, depth);
			const currentScore = evalResult.score;
			const currentWinChance = centipawnsToWinChance(currentScore);

			const playerColor = move.color; // 'w' or 'b'
			const moveNumber = Math.floor(i / 2) + 1;

			// Win chance drop from the player's perspective
			let winDrop = 0;
			if (playerColor === 'w') {
				winDrop = Math.max(0, prevWinChance - currentWinChance);
			} else {
				const prevBlackWinChance = 100 - prevWinChance;
				const currentBlackWinChance = 100 - currentWinChance;
				winDrop = Math.max(0, prevBlackWinChance - currentBlackWinChance);
			}

			// Pre-move top engine recommendation from fenBefore
			const bestEvalBefore = await this.stockfish.evaluatePosition(fenBefore, depth);
			const bestMoveSanObj = uciToSan(fenBefore, bestEvalBefore.bestMove);
			const bestContinuationSan = convertPvToSan(fenBefore, bestEvalBefore.pv);

			// Accuracy score for this move (100% - penalty)
			const moveAccuracy = Math.max(0, Math.min(100, 100 - winDrop * 2.5));
			if (playerColor === 'w') {
				whiteAccuracySum += moveAccuracy;
				whiteMoveCount++;
			} else {
				blackAccuracySum += moveAccuracy;
				blackMoveCount++;
			}

			// Classify move
			let classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' = 'best';
			let explanation = '';

			const isPlayedMoveBest = bestMoveSanObj && (bestMoveSanObj.san === move.san || (bestMoveSanObj.from === move.from && bestMoveSanObj.to === move.to));

			if (isPlayedMoveBest || winDrop < 2.0) {
				if (move.captured && (currentWinChance > 80 || currentWinChance < 20) && winDrop <= 0.5) {
					classification = 'brilliant';
					explanation = 'A brilliant tactical move!';
				} else {
					classification = 'best';
					explanation = 'The best move in the position.';
				}
			} else if (winDrop <= 5.0) {
				classification = 'excellent';
				explanation = 'An excellent and solid move.';
			} else if (winDrop <= 10.0) {
				classification = 'good';
				explanation = 'A good playable move.';
			} else if (winDrop <= 20.0) {
				classification = 'inaccuracy';
				explanation = bestMoveSanObj ? `An inaccuracy. Better was ${bestMoveSanObj.san}.` : 'An inaccuracy that gives away initiative.';
			} else if (winDrop <= 35.0) {
				classification = 'mistake';
				explanation = bestMoveSanObj ? `A mistake. The best continuation was ${bestMoveSanObj.san}.` : 'A mistake that worsens the position.';
			} else {
				classification = 'blunder';
				explanation = bestMoveSanObj ? `A blunder. Overlooked ${bestMoveSanObj.san} which maintains the advantage.` : 'A blunder that loses significant material or advantage.';
			}

			if (playerColor === 'w') {
				summary.white[classification]++;
			} else {
				summary.black[classification]++;
			}

			positions.push({
				ply: i,
				moveNumber,
				color: playerColor,
				san: move.san,
				from: move.from,
				to: move.to,
				fenBefore,
				fenAfter,
				score: currentScore,
				mate: evalResult.mate,
				winChance: Math.round(currentWinChance * 10) / 10,
				bestMove: bestMoveSanObj,
				continuation: bestContinuationSan,
				classification,
				explanation,
			});

			prevScore = currentScore;
			prevWinChance = currentWinChance;
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
