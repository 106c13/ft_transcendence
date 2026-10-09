import express from 'express';
import cors from 'cors';
import { StockfishService } from './stockfish';
import { GameAnalyzer } from './analyzer';

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const stockfish = new StockfishService();
const analyzer = new GameAnalyzer(stockfish);

app.get('/health', (req, res) => {
	res.json({ status: 'ok', engine: 'stockfish' });
});

app.post('/analyze', async (req, res) => {
	const { pgn, depth = 15 } = req.body;
	if (!pgn) {

		return res.status(400).json({ error: 'Missing pgn in request body' });
	}

	try {
		console.log(`[Engine] Analyzing match (PGN length: ${pgn.length}, depth: ${depth})...`);
		const startTime = Date.now();
		const result = await analyzer.analyzeGame(pgn, Math.min(Math.max(depth, 8), 24));
		const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`[Engine] Analysis completed in ${elapsed}s for ${result.positions.length} moves.`);


		res.json(result);
	} catch (err: any) {
		console.error('[Engine] Analysis failed:', err);
		res.status(500).json({ error: err?.message || 'Failed to analyze game' });
	}
});

import { Chess } from 'chess.js';

app.post('/evaluate', async (req, res) => {
	const { fen, depth = 12 } = req.body;
	if (!fen) {
		return res.status(400).json({ error: 'Missing fen in request body' });
	}

	try {
		const targetDepth = Math.min(Math.max(depth, 5), 20);
		const rawEval = await stockfish.evaluatePosition(fen, targetDepth, 3);

		const formattedLines: Array<{
			score: number;
			mate: number | null;
			bestMove: string;
			bestMoveSan: string;
			pv: string[];
			pvSan: string[];
			depth: number;
			multipv: number;
		}> = [];

		const sourceLines = (rawEval.lines && rawEval.lines.length > 0)
			? rawEval.lines
			: [{
				score: rawEval.score,
				mate: rawEval.mate,
				bestMove: rawEval.bestMove,
				pv: rawEval.pv,
				depth: rawEval.depth,
				multipv: 1,
			}];

		for (const line of sourceLines) {
			let bestMoveSan = line.bestMove;
			const pvSan: string[] = [];

			try {
				const pvChess = new Chess(fen);
				for (let i = 0; i < line.pv.length && i < 8; i++) {
					const uci = line.pv[i];
					if (!uci || uci.length < 4) break;
					const from = uci.substring(0, 2);
					const to = uci.substring(2, 4);
					const promotion = uci.length > 4 ? uci[4] : undefined;
					const m = pvChess.move({ from, to, promotion });
					if (m) {
						pvSan.push(m.san);
						if (i === 0) bestMoveSan = m.san;
					} else {
						break;
					}
				}
			} catch {}

			formattedLines.push({
				score: line.score,
				mate: line.mate,
				bestMove: line.bestMove,
				bestMoveSan,
				pv: line.pv,
				pvSan,
				depth: line.depth,
				multipv: line.multipv,
			});
		}

		const top = formattedLines[0] || {
			score: rawEval.score,
			mate: rawEval.mate,
			bestMove: rawEval.bestMove,
			bestMoveSan: rawEval.bestMove,
			pv: rawEval.pv,
			pvSan: [],
			depth: rawEval.depth,
			multipv: 1,
		};

		res.json({
			score: top.score,
			mate: top.mate,
			bestMove: top.bestMove,
			bestMoveSan: top.bestMoveSan,
			pv: top.pv,
			pvSan: top.pvSan,
			depth: top.depth,
			lines: formattedLines,
		});
	} catch (err: any) {
		console.error('[Engine] Position evaluation failed:', err);
		res.status(500).json({ error: err?.message || 'Failed to evaluate position' });
	}
});

app.listen(port, () => {
	console.log(`Stockfish Analysis Microservice listening on port ${port}`);
});
