import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { QuizModule } from '../quiz/quiz.module';
import { UsersModule } from '../users/users.module';
import { ResultsModule } from '../results/results.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    QuizModule, 
    UsersModule, 
    ResultsModule, 
    AuthModule,
    JwtModule.register({
      secret: 'b07b56f537fb7a8165594a198a3296f9',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
