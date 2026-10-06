import { Controller, Get, Param, Query } from '@nestjs/common';
import { LeaderboardService, LeaderboardQueryDto } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
	constructor(private readonly leaderboardService: LeaderboardService) {}

	@Get()
	async getLeaderboard(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string,
		@Query('mode') mode?: any,
		@Query('minGames') minGames?: string,
		@Query('minWinRate') minWinRate?: string,
		@Query('minRating') minRating?: string,
		@Query('maxRating') maxRating?: string,
		@Query('tier') tier?: any,
		@Query('status') status?: any,
		@Query('sortBy') sortBy?: any,
		@Query('order') order?: any,
	) {
		const queryDto: LeaderboardQueryDto = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 30,
			search,
			mode,
			minGames: minGames ? parseInt(minGames, 10) : undefined,
			minWinRate: minWinRate ? parseFloat(minWinRate) : undefined,
			minRating: minRating ? parseInt(minRating, 10) : undefined,
			maxRating: maxRating ? parseInt(maxRating, 10) : undefined,
			tier,
			status,
			sortBy,
			order,
		};

		return this.leaderboardService.getLeaderboard(queryDto);
	}

	@Get('user/:id')
	async getUserLeaderboard(@Param('id') id: string) {
		return this.leaderboardService.getUserLeaderboardInfo(parseInt(id, 10));
	}
}
