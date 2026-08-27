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
	const { pgn, depth = 12 } = req.body;
	if (!pgn) {
		return res.status(400).json({ error: 'Missing pgn in request body' });
	}

	try {
		console.log(`[Engine] Analyzing match (PGN length: ${pgn.length}, depth: ${depth})...`);
		const startTime = Date.now();
		const result = await analyzer.analyzeGame(pgn, Math.min(Math.max(depth, 8), 16));
		const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`[Engine] Analysis completed in ${elapsed}s for ${result.positions.length} moves.`);

		res.json(result);
	} catch (err: any) {
		console.error('[Engine] Analysis failed:', err);
		res.status(500).json({ error: err?.message || 'Failed to analyze game' });
	}
});

app.listen(port, () => {
	console.log(`Stockfish Analysis Microservice listening on port ${port}`);
});
