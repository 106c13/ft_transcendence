import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as readline from 'readline';

export interface EngineLine {
	score: number;
	mate: number | null;
	bestMove: string;
	pv: string[];
	depth: number;
	multipv: number;
}

export interface EvalResult {
	score: number; // centipawns from White's perspective (+ White, - Black)
	mate: number | null; // mate in N from White's perspective (+ White mates, - Black mates)
	bestMove: string; // e.g. "e2e4"
	pv: string[]; // principal variation line e.g. ["e2e4", "e7e5", "g1f3"]
	depth: number;
	lines?: EngineLine[];
}

export class StockfishService {
	private enginePath: string;

	constructor(enginePath: string = process.env.STOCKFISH_PATH || 'stockfish') {
		this.enginePath = enginePath;
	}

	async evaluatePosition(fen: string, depth: number = 15, multiPv: number = 1): Promise<EvalResult> {
		return new Promise((resolve, reject) => {
			let process: ChildProcessWithoutNullStreams;
			try {
				process = spawn(this.enginePath);
			} catch (err) {
				return reject(new Error(`Failed to start Stockfish at "${this.enginePath}": ${err}`));
			}

			const rl = readline.createInterface({ input: process.stdout });

			const linesMap = new Map<number, EngineLine>();
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
				const sortedLines = Array.from(linesMap.entries())
					.sort(([a], [b]) => a - b)
					.map(([_, l]) => l);
				resolve({
					score: sortedLines[0]?.score ?? latestScore,
					mate: sortedLines[0]?.mate ?? latestMate,
					bestMove: sortedLines[0]?.bestMove || bestMove || '0000',
					pv: sortedLines[0]?.pv ?? latestPv,
					depth: sortedLines[0]?.depth ?? latestDepth,
					lines: sortedLines,
				});
			}, 6000);

			rl.on('line', (line: string) => {
				if (line.startsWith('info') && line.includes('score')) {
					const depthMatch = line.match(/depth (\d+)/);
					let curDepth = latestDepth;
					if (depthMatch) {
						curDepth = parseInt(depthMatch[1], 10);
						latestDepth = curDepth;
					}

					const multipvMatch = line.match(/multipv (\d+)/);
					const multipvNum = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;

					let lineScore = 0;
					let lineMate: number | null = null;

					const cpMatch = line.match(/score cp (-?\d+)/);
					if (cpMatch) {
						let cp = parseInt(cpMatch[1], 10);
						if (turn === 'b') {
							cp = -cp;
						}
						lineScore = cp;
						lineMate = null;
						if (multipvNum === 1) {
							latestScore = cp;
							latestMate = null;
						}
					}

					const mateMatch = line.match(/score mate (-?\d+)/);
					if (mateMatch) {
						const mateIn = parseInt(mateMatch[1], 10);
						if (mateIn === 0) {
							if (turn === 'b') {
								lineMate = 0;
								lineScore = 10000;
							} else {
								lineMate = 0;
								lineScore = -10000;
							}
						} else if (turn === 'w') {
							lineMate = mateIn;
							lineScore = mateIn > 0 ? 10000 - mateIn * 100 : -10000 + Math.abs(mateIn) * 100;
						} else {
							lineMate = -mateIn;
							lineScore = mateIn > 0 ? -10000 + mateIn * 100 : 10000 - Math.abs(mateIn) * 100;
						}
						if (multipvNum === 1) {
							latestMate = lineMate;
							latestScore = lineScore;
						}
					}

					let linePv: string[] = [];
					const pvIndex = line.indexOf(' pv ');
					if (pvIndex !== -1) {
						const pvStr = line.substring(pvIndex + 4).trim();
						linePv = pvStr.split(/\s+/).filter(Boolean);
						if (multipvNum === 1) {
							latestPv = linePv;
						}
					}

					if (linePv.length > 0) {
						linesMap.set(multipvNum, {
							score: lineScore,
							mate: lineMate,
							bestMove: linePv[0],
							pv: linePv,
							depth: curDepth,
							multipv: multipvNum,
						});
					}
				}

				if (line.startsWith('bestmove')) {
					clearTimeout(timeout);
					const parts = line.split(' ');
					bestMove = parts[1] || '';
					try {
						process.kill();
					} catch {}

					const sortedLines = Array.from(linesMap.entries())
						.sort(([a], [b]) => a - b)
						.map(([_, l]) => l);

					resolve({
						score: sortedLines[0]?.score ?? latestScore,
						mate: sortedLines[0]?.mate ?? latestMate,
						bestMove: sortedLines[0]?.bestMove || bestMove,
						pv: sortedLines[0]?.pv ?? latestPv,
						depth: sortedLines[0]?.depth ?? latestDepth,
						lines: sortedLines,
					});
				}
			});

			process.on('error', (err) => {
				clearTimeout(timeout);
				reject(err);
			});

			process.stdin.write('uci\n');
			if (multiPv > 1) {
				process.stdin.write(`setoption name MultiPV value ${multiPv}\n`);
			}
			process.stdin.write('isready\n');
			process.stdin.write(`position fen ${fen}\n`);
			process.stdin.write(`go depth ${depth}\n`);
		});
	}
}
