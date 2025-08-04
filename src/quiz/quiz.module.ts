import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { Quiz } from './quiz.entity';
import { Question } from './question.entity';
import { ResultsModule } from '../results/results.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, Question]), ResultsModule],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {} 