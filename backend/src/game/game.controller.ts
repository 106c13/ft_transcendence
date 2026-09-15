import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { RatingService } from './rating.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
	constructor(
		private readonly gameService: GameService,
		private readonly ratingService: RatingService
	) {}

	@Get('history/:username')
	async getHistory(@Param('username') username: string) {
		return this.gameService.getMatchesByUsername(username);
	}

	@Get('analyze/:id')
	async analyzeMatch(@Param('id') id: string) {
		return this.gameService.analyzeMatch(parseInt(id, 10));
	}

	@Get('ratings/:username')
	async getRatings(@Param('username') username: string) {
		return this.ratingService.getAllRatingsByUsername(username);
	}

	@Get(':id')
	async getMatch(@Param('id') id: string) {
		return this.gameService.getMatchById(parseInt(id, 10));
	}
}

