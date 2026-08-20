import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
	constructor(private readonly gameService: GameService) {}

	@Get('history/:username')
	async getHistory(@Param('username') username: string) {
		return this.gameService.getMatchesByUsername(username);
	}

	@Get(':id')
	async getMatch(@Param('id') id: string) {
		return this.gameService.getMatchById(parseInt(id, 10));
	}
}
