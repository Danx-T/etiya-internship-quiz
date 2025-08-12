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
    console.log('getLeaderboard called with quizId:', quizId);
    
    try {
      if (quizId) {
        // Belirli bir quiz için liderlik tablosu
        const results = await this.resultRepository.find({
          where: { quizId },
          relations: ['user', 'quiz'],
          order: { score: 'DESC', timeSpent: 'ASC' },
        });
        
        console.log('Quiz-specific results:', results);
        
        // Her kullanıcının en iyi skorunu al
        const bestScores = new Map();
        results.forEach(result => {
          const userId = result.user.id;
          if (!bestScores.has(userId) || bestScores.get(userId).score < result.score) {
            bestScores.set(userId, result);
          }
        });
        
        const leaderboard = Array.from(bestScores.values()).map(result => ({
          user_username: result.user.username,
          quiz_title: result.quiz.title,
          result_score: result.score,
          result_totalQuestions: result.totalQuestions,
          result_timeSpent: result.timeSpent,
          result_createdAt: result.createdAt,
        }));
        
        console.log('Processed leaderboard:', leaderboard);
        return leaderboard;
      } else {
        // Genel liderlik tablosu
        const results = await this.resultRepository.find({
          relations: ['user', 'quiz'],
          order: { score: 'DESC', timeSpent: 'ASC' },
        });
        
        console.log('General results:', results);
        
        // Her kullanıcının her quiz için en iyi skorunu al
        const bestScores = new Map();
        results.forEach(result => {
          const key = `${result.user.id}-${result.quiz.id}`;
          if (!bestScores.has(key) || bestScores.get(key).score < result.score) {
            bestScores.set(key, result);
          }
        });
        
        const leaderboard = Array.from(bestScores.values()).map(result => ({
          user_username: result.user.username,
          quiz_title: result.quiz.title,
          result_score: result.score,
          result_totalQuestions: result.totalQuestions,
          result_timeSpent: result.timeSpent,
          result_createdAt: result.createdAt,
        }));
        
        console.log('Processed leaderboard:', leaderboard);
        return leaderboard;
      }
    } catch (error) {
      console.error('getLeaderboard error:', error);
      throw error;
    }
  }

  // Admin paneli için gerekli metodlar
  async findAll(): Promise<Result[]> {
    return this.resultRepository.find({
      relations: ['user', 'quiz'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Result> {
    const result = await this.resultRepository.findOne({
      where: { id },
      relations: ['user', 'quiz'],
    });
    
    if (!result) {
      throw new NotFoundException('Sonuç bulunamadı');
    }
    
    return result;
  }

  async count(): Promise<number> {
    return this.resultRepository.count();
  }
} 