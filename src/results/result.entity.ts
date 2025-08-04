import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Quiz } from '../quiz/quiz.entity';

@Entity('results')
export class Result {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  quizId: number;

  @Column()
  score: number; // Doğru cevap sayısı

  @Column()
  totalQuestions: number;

  @Column()
  timeSpent: number; // Toplam geçen süre (saniye)

  @Column('simple-array')
  answers: number[]; // Kullanıcının verdiği cevaplar

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.results)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Quiz)
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
} 