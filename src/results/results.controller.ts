import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(private resultsService: ResultsService) {}

  @Get('my-results')
  async getMyResults(@Request() req) {
    return this.resultsService.getUserResults(req.user.id);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('quizId') quizId?: string) {
    return this.resultsService.getLeaderboard(quizId ? +quizId : undefined);
  }
} 