import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { QuizService } from '../quiz/quiz.service';
import { UsersService } from '../users/users.service';
import { ResultsService } from '../results/results.service';
import { CreateQuizDto } from '../quiz/dto/quiz.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly quizService: QuizService,
    private readonly usersService: UsersService,
    private readonly resultsService: ResultsService,
  ) {}

  // Quiz yönetimi
  @Post('quiz')
  async createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.createQuiz(createQuizDto);
  }

  @Get('quizzes')
  async getAllQuizzes() {
    return this.quizService.getAllQuizzes();
  }

  @Get('quiz/:id')
  async getQuiz(@Param('id') id: number) {
    return this.quizService.getQuizById(id);
  }

  @Delete('quiz/:id')
  async deleteQuiz(@Param('id') id: number) {
    await this.quizService.deleteQuiz(id);
    return { message: 'Quiz başarıyla silindi' };
  }

  // Kullanıcı yönetimi
  @Get('users')
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('users/:id')
  async getUser(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @Put('users/:id/admin')
  async toggleAdminStatus(@Param('id') id: number, @Body() body: { isAdmin: boolean }) {
    return this.usersService.updateAdminStatus(id, body.isAdmin);
  }

  // Sonuç yönetimi
  @Get('results')
  async getAllResults() {
    return this.resultsService.findAll();
  }

  @Get('results/:id')
  async getResult(@Param('id') id: number) {
    return this.resultsService.findById(id);
  }

  // İstatistikler
  @Get('stats')
  async getStats() {
    const [totalUsers, totalQuizzes, totalResults] = await Promise.all([
      this.usersService.count(),
      this.quizService.count(),
      this.resultsService.count(),
    ]);

    return {
      totalUsers,
      totalQuizzes,
      totalResults,
    };
  }
}
