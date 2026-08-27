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

function getMaterial(fen: string, color: 'w' | 'b'): number {
	const boardPart = fen.split(' ')[0];
	let total = 0;
	for (const char of boardPart) {
		const isWhite = char >= 'A' && char <= 'Z';
		const lower = char.toLowerCase();
		if (PIECE_VALUES[lower]) {
			if ((color === 'w' && isWhite) || (color === 'b' && !isWhite)) {
				total += PIECE_VALUES[lower];
			}
		}
	}
	return total;
}

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

function checkSacrifice(fenBefore: string, fenAfter: string, playerColor: 'w' | 'b', playedMove: any): boolean {
	const opponentColor = playerColor === 'w' ? 'b' : 'w';
	const myMatBefore = getMaterial(fenBefore, playerColor);
	const oppMatBefore = getMaterial(fenBefore, opponentColor);
	const myMatAfter = getMaterial(fenAfter, playerColor);
	const oppMatAfter = getMaterial(fenAfter, opponentColor);

	const netMaterialBefore = myMatBefore - oppMatBefore;
	const netMaterialAfter = myMatAfter - oppMatAfter;

	// Did player lose net material directly (e.g. piece captured of lower value or moved into capture)
	const pieceMovedType = playedMove.piece; // 'p', 'n', 'b', 'r', 'q'
	const capturedType = playedMove.captured; // 'p', 'n', ...

	if (pieceMovedType !== 'p') {
		const movedVal = PIECE_VALUES[pieceMovedType] || 0;
		const capturedVal = capturedType ? (PIECE_VALUES[capturedType] || 0) : 0;
		// If gave up a higher piece for lower piece or nothing
		if (movedVal > capturedVal + 100) {
			return true;
		}
	}

	if (netMaterialAfter < netMaterialBefore - 150) {
		return true;
	}

	return false;
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
			const fenBefore = replay.fen();

			// 1. Evaluate position BEFORE the move (to get best move and best possible evaluation)
			const evalBefore = await this.stockfish.evaluatePosition(fenBefore, depth);
			const bestMoveSanObj = uciToSan(fenBefore, evalBefore.bestMove);
			const bestContinuationSan = convertPvToSan(fenBefore, evalBefore.pv);

			// Apply the player's move
			replay.move(move);
			const fenAfter = replay.fen();

			// 2. Evaluate position AFTER the move
			const evalAfter = await this.stockfish.evaluatePosition(fenAfter, depth);

			const playerColor = move.color; // 'w' or 'b'
			const moveNumber = Math.floor(i / 2) + 1;

			// Normalize scores from the moving player's perspective (+ is good for moving player)
			const bestEvalFromPlayer = playerColor === 'w' ? evalBefore.score : -evalBefore.score;
			const playedEvalFromPlayer = playerColor === 'w' ? evalAfter.score : -evalAfter.score;

			// 3. Centipawn Loss (CPL) = bestEval - playedEval
			const rawCpl = bestEvalFromPlayer - playedEvalFromPlayer;
			const centipawnLoss = Math.max(0, rawCpl);

			// Score from White's perspective for global board eval
			const scoreWhitePerspective = evalAfter.score;
			const winChanceWhite = centipawnsToWinChance(scoreWhitePerspective);

			// 4. Move accuracy % derived from CPL (smooth exponential curve)
			const moveAccuracy = Math.max(0, Math.min(100, Math.round((100 * Math.exp(-0.0035 * centipawnLoss)) * 10) / 10));
			if (playerColor === 'w') {
				whiteAccuracySum += moveAccuracy;
				whiteMoveCount++;
			} else {
				blackAccuracySum += moveAccuracy;
				blackMoveCount++;
			}

			// 5. Classification based on CPL and Sacrifice Detection
			let classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' = 'best';
			let explanation = '';

			const isSacrifice = checkSacrifice(fenBefore, fenAfter, playerColor, move);
			const isPlayedMoveBest = bestMoveSanObj && (bestMoveSanObj.san === move.san || (bestMoveSanObj.from === move.from && bestMoveSanObj.to === move.to));

			// Brilliant Move condition:
			// - Low CPL (<= 15) or matches best move
			// - Involves material sacrifice
			// - Player position is clearly winning/strong (playedEvalFromPlayer >= +150 cp or mate)
			if (isSacrifice && centipawnLoss <= 15 && playedEvalFromPlayer >= 150) {
				classification = 'brilliant';
				explanation = 'A brilliant move involving a tactical piece sacrifice while keeping a winning advantage!';
			} else if (centipawnLoss <= 10 || isPlayedMoveBest) {
				classification = 'best';
				explanation = 'The best move in this position.';
			} else if (centipawnLoss <= 30) {
				classification = 'excellent';
				explanation = 'An excellent and solid move.';
			} else if (centipawnLoss <= 80) {
				classification = 'good';
				explanation = 'A good, natural move.';
			} else if (centipawnLoss <= 150) {
				classification = 'inaccuracy';
				explanation = bestMoveSanObj
					? `An inaccuracy (lost ${Math.round(centipawnLoss)} cp). Better was ${bestMoveSanObj.san}.`
					: `An inaccuracy (lost ${Math.round(centipawnLoss)} cp).`;
			} else if (centipawnLoss <= 300) {
				classification = 'mistake';
				explanation = bestMoveSanObj
					? `A mistake (lost ${Math.round(centipawnLoss)} cp). The best continuation was ${bestMoveSanObj.san}.`
					: `A mistake (lost ${Math.round(centipawnLoss)} cp) that worsens your position.`;
			} else {
				classification = 'blunder';
				explanation = bestMoveSanObj
					? `A blunder (lost ${Math.round(centipawnLoss)} cp). Overlooked ${bestMoveSanObj.san} which keeps the advantage.`
					: `A critical blunder (lost ${Math.round(centipawnLoss)} cp) that loses significant advantage.`;
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
				score: scoreWhitePerspective,
				mate: evalAfter.mate,
				centipawnLoss: Math.round(centipawnLoss),
				winChance: Math.round(winChanceWhite * 10) / 10,
				bestMove: bestMoveSanObj,
				continuation: bestContinuationSan,
				classification,
				explanation,
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
