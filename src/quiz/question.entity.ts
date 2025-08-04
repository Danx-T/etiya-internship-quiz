import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  questionText: string;

  @Column('simple-array')
  options: string[];

  @Column()
  correctAnswer: number; // 0, 1, 2, 3 (options array'indeki index)

  @Column()
  quizId: number;

  @ManyToOne(() => Quiz, quiz => quiz.questions)
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
} 