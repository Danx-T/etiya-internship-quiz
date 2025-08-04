import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { PasswordReset } from './password-reset.entity';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(
      registerDto.username,
      registerDto.email,
      registerDto.password,
    );

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Geçersiz kullanıcı adı veya şifre');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz kullanıcı adı veya şifre');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const user = await this.usersService.findByEmail(forgotPasswordDto.email);
      if (!user) {
        // Güvenlik için kullanıcı bulunamasa bile başarılı mesajı döndür
        return { message: 'Şifre sıfırlama linki email adresinize gönderildi' };
      }

      // Eski token'ları temizle
      await this.passwordResetRepository.delete({ email: forgotPasswordDto.email });

      // Yeni token oluştur
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 saat geçerli

      const passwordReset = this.passwordResetRepository.create({
        email: forgotPasswordDto.email,
        token,
        expiresAt,
      });

      await this.passwordResetRepository.save(passwordReset);

      // Email gönder
      await this.mailService.sendPasswordResetEmail(forgotPasswordDto.email, token);

      return { message: 'Şifre sıfırlama linki email adresinize gönderildi' };
    } catch (error) {
      console.error('Forgot password hatası:', error);
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const passwordReset = await this.passwordResetRepository.findOne({
      where: { token: resetPasswordDto.token },
    });

    if (!passwordReset) {
      throw new NotFoundException('Geçersiz veya süresi dolmuş token');
    }

    if (new Date() > passwordReset.expiresAt) {
      await this.passwordResetRepository.delete({ token: resetPasswordDto.token });
      throw new NotFoundException('Token süresi dolmuş');
    }

    const user = await this.usersService.findByEmail(passwordReset.email);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Şifreyi güncelle
    await this.usersService.updatePassword(user.id, resetPasswordDto.newPassword);

    // Token'ı sil
    await this.passwordResetRepository.delete({ token: resetPasswordDto.token });

    return { message: 'Şifre başarıyla sıfırlandı' };
  }
} 