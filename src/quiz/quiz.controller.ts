import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto, SubmitQuizDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResultsService } from '../results/results.service';

@Controller('quiz')
export class QuizController {
  constructor(
    private quizService: QuizService,
    private resultsService: ResultsService,
  ) {}

  @Get()
  async getAllQuizzes() {
    return this.quizService.getAllQuizzes();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getQuiz(@Param('id') id: string) {
    return this.quizService.getQuizForUser(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.createQuiz(createQuizDto);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submitQuiz(@Request() req, @Body() submitQuizDto: SubmitQuizDto) {
    return this.resultsService.submitQuiz(req.user.id, submitQuizDto);
  }
} 