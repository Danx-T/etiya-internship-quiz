import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { Result } from './result.entity';
import { Quiz } from '../quiz/quiz.entity';
import { Question } from '../quiz/question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Result, Quiz, Question])],
  providers: [ResultsService],
  controllers: [ResultsController],
  exports: [ResultsService],
})
export class ResultsModule {} 