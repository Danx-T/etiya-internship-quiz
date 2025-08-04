import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from './result.entity';
import { Quiz } from '../quiz/quiz.entity';
import { Question } from '../quiz/question.entity';
import { SubmitQuizDto } from '../quiz/dto/quiz.dto';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Result)
    private resultRepository: Repository<Result>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async submitQuiz(userId: number, submitQuizDto: SubmitQuizDto): Promise<Result> {
    const quiz = await this.quizRepository.findOne({
      where: { id: submitQuizDto.quizId },
      relations: ['questions'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz bulunamadı');
    }

    // Doğru cevap sayısını hesapla
    let score = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      if (submitQuizDto.answers[i] === quiz.questions[i].correctAnswer) {
        score++;
      }
    }

    const result = this.resultRepository.create({
      userId,
      quizId: submitQuizDto.quizId,
      score,
      totalQuestions: quiz.questions.length,
      timeSpent: submitQuizDto.timeSpent,
      answers: submitQuizDto.answers,
    });

    return this.resultRepository.save(result);
  }

  async getUserResults(userId: number): Promise<Result[]> {
    return this.resultRepository.find({
      where: { userId },
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }

  async getLeaderboard(quizId?: number): Promise<any[]> {
    const query = this.resultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.user', 'user')
      .leftJoinAndSelect('result.quiz', 'quiz')
      .select([
        'user.username',
        'quiz.title',
        'result.score',
        'result.totalQuestions',
        'result.timeSpent',
        'result.createdAt',
      ])
      .orderBy('result.score', 'DESC')
      .addOrderBy('result.timeSpent', 'ASC');

    if (quizId) {
      query.where('result.quizId = :quizId', { quizId });
    }

    return query.getRawMany();
  }
} 