import { IsString, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(5)
  @Max(60)
  timePerQuestion: number;

  @IsArray()
  questions: CreateQuestionDto[];
}

export class CreateQuestionDto {
  @IsString()
  questionText: string;

  @IsArray()
  options: string[];

  @IsNumber()
  @Min(0)
  @Max(3)
  correctAnswer: number;
}

export class SubmitQuizDto {
  @IsNumber()
  quizId: number;

  @IsArray()
  answers: number[];

  @IsNumber()
  timeSpent: number;
} 