import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './quiz.entity';
import { Question } from './question.entity';
import { CreateQuizDto } from './dto/quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async createQuiz(createQuizDto: CreateQuizDto): Promise<Quiz> {
    const quiz = this.quizRepository.create({
      title: createQuizDto.title,
      description: createQuizDto.description,
      timePerQuestion: createQuizDto.timePerQuestion,
    });

    const savedQuiz = await this.quizRepository.save(quiz);

    // Soruları kaydet
    for (const questionDto of createQuizDto.questions) {
      const question = this.questionRepository.create({
        ...questionDto,
        quizId: savedQuiz.id,
      });
      await this.questionRepository.save(question);
    }

    return savedQuiz;
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return this.quizRepository.find({
      where: { isActive: true },
      relations: ['questions'],
    });
  }

  async getQuizById(id: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id, isActive: true },
      relations: ['questions'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz bulunamadı');
    }

    return quiz;
  }

  async getQuizForUser(id: number): Promise<Quiz> {
    const quiz = await this.getQuizById(id);
    
    // Doğru cevapları gizle
    quiz.questions = quiz.questions.map(q => ({
      ...q,
      correctAnswer: undefined,
    }));

    return quiz;
  }
} 