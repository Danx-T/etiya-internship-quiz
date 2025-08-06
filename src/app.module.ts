import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuizModule } from './quiz/quiz.module';
import { ResultsModule } from './results/results.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'quiz_app',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Sadece geliştirme için
    }),
    PassportModule,
    AuthModule,
    UsersModule,
    QuizModule,
    ResultsModule,
    MailModule,
  ],
})
export class AppModule {} 