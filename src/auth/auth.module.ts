import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PasswordReset } from './password-reset.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    MailModule,
    TypeOrmModule.forFeature([PasswordReset]),
    JwtModule.register({
      secret: 'b07b56f537fb7a8165594a198a3296f9',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {} 