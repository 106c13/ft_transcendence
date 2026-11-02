import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	UseGuards,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { GameService } from './game.service';
import { RatingService } from './rating.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
	constructor(
		private readonly gameService: GameService,
		private readonly ratingService: RatingService
	) { }

	@Get('history/:username')
	async getHistory(@Param('username') username: string) {
		return this.gameService.getMatchesByUsername(username);
	}

	@Get('analyze/:id')
	async analyzeMatch(@Param('id') id: string, @Query('force') force?: string) {
		const matchId = parseInt(id, 10);
		if (isNaN(matchId)) {
			throw new BadRequestException('invalid_match_id');
		}
		return this.gameService.analyzeMatch(matchId, force === 'true');
	}

	@Post('analyze-pgn')
	async analyzePgn(@Body() body: { pgn: string; depth?: number }) {
		return this.gameService.analyzePgn(body.pgn, body.depth);
	}

	@Post('evaluate')
	async evaluatePosition(@Body() body: { fen: string; depth?: number }) {
		return this.gameService.evaluatePosition(body.fen, body.depth);
	}

	@Get('ratings/:username')
	async getRatings(@Param('username') username: string) {
		return this.ratingService.getAllRatingsByUsername(username);
	}

	@Get('live/:username')
	async getLiveGame(@Param('username') username: string) {
		const liveGame = await this.gameService.getLiveGameByUsername(username);
		return liveGame ?? { live: false };
	}

	@Get(':id')
	async getMatch(@Param('id') id: string) {
		const matchId = parseInt(id, 10);
		if (isNaN(matchId)) {
			throw new BadRequestException('invalid_match_id');
		}
		const match = await this.gameService.getMatchById(matchId);
		if (!match) {
			throw new NotFoundException('match_not_found');
		}
		return match;
	}
}

