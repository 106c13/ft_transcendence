import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Match } from './match.entity';
import { Chess } from 'chess.js';

export interface ChessPlayer {
	userId: number;
	socketId: string;
	username: string;
}

export interface ChessGame {
	gameId: string;
	white: ChessPlayer;
	black: ChessPlayer;
	board: Chess;
	mode: 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2';
	increment: number; // ms to add per move
	whiteTime: number; // Remaining time in ms
	blackTime: number; // Remaining time in ms
	lastMoveTime: number; // timestamp
	timer: NodeJS.Timeout | null;
	disconnectTimers: Map<number, NodeJS.Timeout>;
	disconnectedPlayerIds: Set<number>;
}

@Injectable()
export class GameService {
	// Active games mapped by gameId
	private activeGames = new Map<string, ChessGame>();

	// Matchmaking queues separated by mode
	private queues: Record<'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2', ChessPlayer[]> = {
		bullet: [],
		blitz: [],
		rapid: [],
		'bullet+2': [],
		'blitz+2': [],
		'rapid+2': [],
	};

	// Callback to notify gateway when timers expire or game state changes
	private gameEventsCallback: (event: string, game: ChessGame, payload: any) => void = () => {};

	constructor(
		@InjectRepository(Match)
		private matchRepo: Repository<Match>,
		@InjectRepository(User)
		private userRepo: Repository<User>,
	) {}

	setGameEventsCallback(callback: (event: string, game: ChessGame, payload: any) => void) {
		this.gameEventsCallback = callback;
	}

	getActiveGamesCount() {
		return this.activeGames.size;
	}

	getQueueLengths() {
		return {
			bullet: this.queues.bullet.length,
			blitz: this.queues.blitz.length,
			rapid: this.queues.rapid.length,
			'bullet+2': this.queues['bullet+2'].length,
			'blitz+2': this.queues['blitz+2'].length,
			'rapid+2': this.queues['rapid+2'].length,
		};
	}

	getGame(gameId: string): ChessGame | undefined {
		return this.activeGames.get(gameId);
	}

	getGameByUserId(userId: number): ChessGame | undefined {
		for (const game of this.activeGames.values()) {
			if (game.white.userId === userId || game.black.userId === userId) {
				return game;
			}
		}
		return undefined;
	}

	// Add player to matchmaking queue
	addToQueue(userId: number, socketId: string, username: string, mode: 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'): ChessGame | null {
		// 1. Remove from other queues first
		this.removeFromQueue(userId);

		// 2. Check if player has an active game to resume
		const existingGame = this.getGameByUserId(userId);
		if (existingGame) {
			return existingGame;
		}

		// 3. Add to the queue
		const queue = this.queues[mode];
		queue.push({ userId, socketId, username });

		// 4. Pair if we have at least 2 players
		if (queue.length >= 2) {
			const player1 = queue.shift()!;
			const player2 = queue.shift()!;

			// Randomize colors
			const isP1White = Math.random() < 0.5;
			const white = isP1White ? player1 : player2;
			const black = isP1White ? player2 : player1;

			const gameId = `game_${Date.now()}_${white.userId}_${black.userId}`;
			const baseMode = mode.replace('+2', '') as 'bullet' | 'blitz' | 'rapid';
			const initialTime = baseMode === 'bullet' ? 60000 : baseMode === 'blitz' ? 180000 : 600000;
			const increment = mode.endsWith('+2') ? 2000 : 0;

			const newGame: ChessGame = {
				gameId,
				white,
				black,
				board: new Chess(),
				mode,
				increment,
				whiteTime: initialTime,
				blackTime: initialTime,
				lastMoveTime: Date.now(),
				timer: null,
				disconnectTimers: new Map(),
				disconnectedPlayerIds: new Set(),
			};

			this.activeGames.set(gameId, newGame);

			// Start the timer for White's turn
			this.startTurnTimer(newGame);

			return newGame;
		}

		return null;
	}

	// Remove player from matchmaking queue
	removeFromQueue(userId: number) {
		for (const mode of ['bullet', 'blitz', 'rapid', 'bullet+2', 'blitz+2', 'rapid+2'] as const) {
			this.queues[mode] = this.queues[mode].filter(p => p.userId !== userId);
		}
	}

	// Make a move on the board
	makeMove(gameId: string, userId: number, from: string, to: string, promotion?: string): any {
		const game = this.activeGames.get(gameId);
		if (!game) {
			return { error: 'Game not found' };
		}

		if (game.disconnectedPlayerIds.size > 0) {
			return { error: 'Game paused. Opponent is disconnected' };
		}

		const turn = game.board.turn(); // 'w' or 'b'
		const expectedPlayer = turn === 'w' ? game.white : game.black;

		if (expectedPlayer.userId !== userId) {
			return { error: 'Not your turn' };
		}

		// Calculate elapsed time and deduct
		const now = Date.now();
		const elapsed = now - game.lastMoveTime;
		if (turn === 'w') {
			game.whiteTime = Math.max(0, game.whiteTime - elapsed);
		} else {
			game.blackTime = Math.max(0, game.blackTime - elapsed);
		}
		game.lastMoveTime = now;

		// Check for timeout
		if (turn === 'w' && game.whiteTime <= 0) {
			this.handleTimeout(game, 'w');
			return { error: 'Time out' };
		}
		if (turn === 'b' && game.blackTime <= 0) {
			this.handleTimeout(game, 'b');
			return { error: 'Time out' };
		}

		// Attempt to apply move
		try {
			const move = game.board.move({
				from,
				to,
				promotion: promotion || 'q',
			});

			if (!move) {
				return { error: 'Invalid move' };
			}

			// Clear current turn timer
			if (game.timer) {
				clearTimeout(game.timer);
				game.timer = null;
			}

			const addIncrement = () => {
				if (turn === 'w') {
					game.whiteTime += game.increment;
				} else {
					game.blackTime += game.increment;
				}
			};

			// Check if game is over
			if (game.board.isGameOver()) {
				addIncrement();
				this.handleGameOver(game);
				return {
					move,
					san: move.san,
					fen: game.board.fen(),
					whiteTime: game.whiteTime,
					blackTime: game.blackTime,
					isGameOver: true,
				};
			}

			// Add increment for the player who just moved
			addIncrement();

			// Start timer for the next turn
			this.startTurnTimer(game);

			return {
				move,
				san: move.san,
				fen: game.board.fen(),
				whiteTime: game.whiteTime,
				blackTime: game.blackTime,
				isGameOver: false,
				turn: game.board.turn(),
				isCheck: game.board.inCheck(),
			};
		} catch (e) {
			return { error: 'Invalid move' };
		}
	}

	// Handle resignation
	resign(gameId: string, userId: number) {
		const game = this.activeGames.get(gameId);
		if (!game) return;

		const winnerColor = game.white.userId === userId ? 'b' : 'w';
		const reason = 'RESIGNATION';

		this.saveMatch(game, reason, winnerColor).then(() => {
			this.gameEventsCallback('game_over', game, {
				winner: winnerColor,
				reason,
				fen: game.board.fen(),
			});
			this.activeGames.delete(gameId);
		});
	}

	// Handle user disconnection from websocket
	handleUserDisconnect(userId: number) {
		const game = this.getGameByUserId(userId);
		if (!game) {
			// Just remove from matchmaking queue if there
			this.removeFromQueue(userId);
			return;
		}

		if (game.disconnectedPlayerIds.has(userId)) return;

		game.disconnectedPlayerIds.add(userId);

		// If both players disconnect, finish game immediately as DRAW
		if (game.disconnectedPlayerIds.size === 2) {
			for (const timer of game.disconnectTimers.values()) {
				clearTimeout(timer);
			}
			game.disconnectTimers.clear();

			const reason = 'DRAW';
			this.saveMatch(game, reason, null).then(() => {
				this.gameEventsCallback('game_over', game, {
					winner: null,
					reason,
					fen: game.board.fen(),
				});
				this.activeGames.delete(game.gameId);
			});
			return;
		}

		// Pause turn timer if first player disconnected
		if (game.timer) {
			clearTimeout(game.timer);
			game.timer = null;
		}

		// Subtract time elapsed before disconnection
		const now = Date.now();
		const elapsed = now - game.lastMoveTime;
		if (game.board.turn() === 'w') {
			game.whiteTime = Math.max(0, game.whiteTime - elapsed);
		} else {
			game.blackTime = Math.max(0, game.blackTime - elapsed);
		}

		// Notify other player
		this.gameEventsCallback('opponent_disconnected', game, {
			userId,
			graceSeconds: this.getGraceSeconds(game.mode),
		});

		// Start grace period countdown for this user
		const graceMs = this.getGraceSeconds(game.mode) * 1000;
		const timer = setTimeout(() => {
			game.disconnectTimers.delete(userId);
			// Grace period expired, opponent wins
			const winnerColor = game.white.userId === userId ? 'b' : 'w';
			const reason = 'DISCONNECTION';

			this.saveMatch(game, reason, winnerColor).then(() => {
				this.gameEventsCallback('game_over', game, {
					winner: winnerColor,
					reason,
					fen: game.board.fen(),
				});
				this.activeGames.delete(game.gameId);
			});
		}, graceMs);

		game.disconnectTimers.set(userId, timer);
	}

	// Handle player reconnecting to WebSocket
	handleUserReconnect(userId: number, newSocketId: string): ChessGame | null {
		const game = this.getGameByUserId(userId);
		if (!game) return null;

		if (game.disconnectedPlayerIds.has(userId)) {
			// Clear disconnection grace timer for this user
			const timer = game.disconnectTimers.get(userId);
			if (timer) {
				clearTimeout(timer);
				game.disconnectTimers.delete(userId);
			}
			game.disconnectedPlayerIds.delete(userId);

			// Update socket ID
			if (game.white.userId === userId) {
				game.white.socketId = newSocketId;
			} else {
				game.black.socketId = newSocketId;
			}

			// Resume turn timer if all players reconnected
			if (game.disconnectedPlayerIds.size === 0) {
				game.lastMoveTime = Date.now();
				this.startTurnTimer(game);
			}

			// Notify opponent
			this.gameEventsCallback('opponent_reconnected', game, { userId });

			return game;
		}

		return null;
	}

	// Start standard chess clock timer for active player
	private startTurnTimer(game: ChessGame) {
		if (game.timer) {
			clearTimeout(game.timer);
		}

		const turn = game.board.turn();
		const remainingTime = turn === 'w' ? game.whiteTime : game.blackTime;
		game.lastMoveTime = Date.now();

		game.timer = setTimeout(() => {
			this.handleTimeout(game, turn);
		}, remainingTime);
	}

	// Time runs out
	private handleTimeout(game: ChessGame, turn: 'w' | 'b') {
		const winnerColor = turn === 'w' ? 'b' : 'w';
		if (turn === 'w') {
			game.whiteTime = 0;
		} else {
			game.blackTime = 0;
		}

		const reason = 'TIMEOUT';

		this.saveMatch(game, reason, winnerColor).then(() => {
			this.gameEventsCallback('game_over', game, {
				winner: winnerColor,
				reason,
				fen: game.board.fen(),
			});
			this.activeGames.delete(game.gameId);
		});
	}

	// Normal game over detection (checkmate, stalemate, draw)
	private handleGameOver(game: ChessGame) {
		let winner: 'w' | 'b' | null = null;
		let reason = 'DRAW';

		if (game.board.isCheckmate()) {
			winner = game.board.turn() === 'w' ? 'b' : 'w'; // winner is opposite of checked king
			reason = 'CHECKMATE';
		} else if (game.board.isStalemate()) {
			reason = 'STALEMATE';
		} else if (game.board.isInsufficientMaterial()) {
			reason = 'INSUFFICIENT_MATERIAL';
		} else if (game.board.isThreefoldRepetition()) {
			reason = 'THREEFOLD_REPETITION';
		} else if (game.board.isDraw()) {
			reason = 'DRAW';
		}

		this.saveMatch(game, reason, winner).then(() => {
			this.gameEventsCallback('game_over', game, {
				winner,
				reason,
				fen: game.board.fen(),
			});
			this.activeGames.delete(game.gameId);
		});
	}

	// Save to DB
	private async saveMatch(game: ChessGame, result: string, winnerColor: 'w' | 'b' | null) {
		if (game.timer) {
			clearTimeout(game.timer);
			game.timer = null;
		}
		for (const timer of game.disconnectTimers.values()) {
			clearTimeout(timer);
		}
		game.disconnectTimers.clear();

		let winnerId: number | null = null;
		if (winnerColor === 'w') {
			winnerId = game.white.userId;
		} else if (winnerColor === 'b') {
			winnerId = game.black.userId;
		}

		try {
			const match = this.matchRepo.create({
				white_id: game.white.userId,
				black_id: game.black.userId,
				winner_id: winnerId,
				mode: game.mode,
				result: result,
				pgn: game.board.pgn(),
			});
			await this.matchRepo.save(match);
		} catch (e) {
			console.error('Failed to save match:', e);
		}
	}

	private getGraceSeconds(mode: 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'): number {
		switch (mode) {
			case 'bullet':
			case 'bullet+2': return 10;
			case 'blitz':
			case 'blitz+2': return 30;
			case 'rapid':
			case 'rapid+2': return 60;
		}
	}

	async getMatchesByUsername(username: string): Promise<Match[]> {
		const user = await this.userRepo.findOne({ where: { username } });
		if (!user) return [];

		return this.matchRepo.find({
			where: [
				{ white_id: user.id },
				{ black_id: user.id },
			],
			relations: ['white', 'black', 'winner'],
			order: { played_at: 'DESC' },
		});
	}

	async getMatchById(id: number): Promise<Match | null> {
		return this.matchRepo.findOne({
			where: { id },
			relations: ['white', 'black', 'winner'],
		});
	}

	async analyzeMatch(id: number): Promise<any> {
		const match = await this.matchRepo.findOne({
			where: { id },
			relations: ['white', 'black', 'winner'],
		});

		if (!match) {
			throw new Error('Match not found');
		}

		if (match.analysis) {
			return match.analysis;
		}

		if (!match.pgn) {
			return { accuracy: { white: 100, black: 100 }, summary: { white: {}, black: {} }, positions: [] };
		}

		const engineUrl = process.env.ENGINE_URL || 'http://engine:5000/analyze';
		const response = await fetch(engineUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ pgn: match.pgn, depth: 20 }),
		});


		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Engine analysis failed: ${errText}`);
		}

		const analysisData = await response.json();

		try {
			match.analysis = analysisData;
			await this.matchRepo.save(match);
		} catch (err) {
			console.error('Failed to cache match analysis in DB:', err);
		}

		return analysisData;
	}
}


