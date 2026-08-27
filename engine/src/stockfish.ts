import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as readline from 'readline';

export interface EvalResult {
	score: number; // centipawns from White's perspective (+ White, - Black)
	mate: number | null; // mate in N from White's perspective (+ White mates, - Black mates)
	bestMove: string; // e.g. "e2e4"
	pv: string[]; // principal variation line e.g. ["e2e4", "e7e5", "g1f3"]
	depth: number;
}

export class StockfishService {
	private enginePath: string;

	constructor(enginePath: string = process.env.STOCKFISH_PATH || 'stockfish') {
		this.enginePath = enginePath;
	}

	async evaluatePosition(fen: string, depth: number = 15): Promise<EvalResult> {

		return new Promise((resolve, reject) => {
			let process: ChildProcessWithoutNullStreams;
			try {
				process = spawn(this.enginePath);
			} catch (err) {
				return reject(new Error(`Failed to start Stockfish at "${this.enginePath}": ${err}`));
			}

			const rl = readline.createInterface({ input: process.stdout });

			let latestScore = 0;
			let latestMate: number | null = null;
			let latestPv: string[] = [];
			let latestDepth = depth;
			let bestMove = '';

			const turn = fen.split(' ')[1] || 'w';

			const timeout = setTimeout(() => {
				try {
					process.kill();
				} catch {}
				resolve({
					score: latestScore,
					mate: latestMate,
					bestMove: bestMove || '0000',
					pv: latestPv,
					depth: latestDepth,
				});
			}, 6000);


			rl.on('line', (line: string) => {
				if (line.startsWith('info') && line.includes('score')) {
					const depthMatch = line.match(/depth (\d+)/);
					if (depthMatch) {
						latestDepth = parseInt(depthMatch[1], 10);
					}

					const cpMatch = line.match(/score cp (-?\d+)/);
					if (cpMatch) {
						let cp = parseInt(cpMatch[1], 10);
						if (turn === 'b') {
							cp = -cp;
						}
						latestScore = cp;
						latestMate = null;
					}

					const mateMatch = line.match(/score mate (-?\d+)/);
					if (mateMatch) {
						let mateIn = parseInt(mateMatch[1], 10);
						if (turn === 'b') {
							mateIn = -mateIn;
						}
						latestMate = mateIn;
						latestScore = mateIn > 0 ? 10000 - mateIn * 100 : -10000 - mateIn * 100;
					}

					const pvIndex = line.indexOf(' pv ');
					if (pvIndex !== -1) {
						const pvStr = line.substring(pvIndex + 4).trim();
						latestPv = pvStr.split(/\s+/).filter(Boolean);
					}
				}

				if (line.startsWith('bestmove')) {
					clearTimeout(timeout);
					const parts = line.split(' ');
					bestMove = parts[1] || '';
					try {
						process.kill();
					} catch {}

					resolve({
						score: latestScore,
						mate: latestMate,
						bestMove: bestMove,
						pv: latestPv,
						depth: latestDepth,
					});
				}
			});

			process.on('error', (err) => {
				clearTimeout(timeout);
				reject(err);
			});

			process.stdin.write('uci\n');
			process.stdin.write('isready\n');
			process.stdin.write(`position fen ${fen}\n`);
			process.stdin.write(`go depth ${depth}\n`);
		});
	}
}
