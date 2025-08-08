import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { PasswordReset } from './password-reset.entity';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { generateVerificationCode } from '../users/users.service';

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

    // Email doğrulama kodu gönder
    await this.mailService.sendEmailVerification(user.email, user.emailVerificationCode);

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    if (user.isEmailVerified) {
      return { message: 'E-posta zaten doğrulanmış' };
    }
    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      throw new UnauthorizedException('Doğrulama kodu bulunamadı');
    }
    if (user.emailVerificationCode !== code) {
      throw new UnauthorizedException('Doğrulama kodu hatalı');
    }
    if (new Date() > user.emailVerificationExpires) {
      throw new UnauthorizedException('Doğrulama kodunun süresi dolmuş');
    }
    
    await this.usersService.setEmailVerified(user.id);
    
    // İlk kayıt doğrulaması için JWT token oluştur ve kullanıcı bilgilerini döndür
    const payload = { username: user.username, sub: user.id };
    return { 
      message: 'E-posta başarıyla doğrulandı',
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: true,
      }
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
    
    // Email doğrulanmamış kullanıcılar için hata atmak yerine bilgi döndür
    if (!user.isEmailVerified) {
      return {
        access_token: null, // Token verme
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isEmailVerified: false,
        },
      };
    }
    
    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' }); // 1 saatlik token
    
    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: true,
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

    // Yeni şifrenin mevcut şifre ile aynı olup olmadığını kontrol et
    const isSamePassword = await bcrypt.compare(resetPasswordDto.newPassword, user.password);
    if (isSamePassword) {
      throw new ConflictException('Yeni şifre mevcut şifre ile aynı olamaz');
    }

    // Şifreyi güncelle
    await this.usersService.updatePassword(user.id, resetPasswordDto.newPassword);

    // Token'ı sil
    await this.passwordResetRepository.delete({ token: resetPasswordDto.token });

    return { message: 'Şifre başarıyla sıfırlandı' };
  }

  async resendEmailVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    if (user.isEmailVerified) {
      return { message: 'E-posta zaten doğrulanmış' };
    }
    // Yeni kod ve süre üret
    const code = generateVerificationCode(8);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await this.usersService.updateEmailVerificationCode(user.id, code, expires);
    await this.mailService.sendEmailVerification(user.email, code);
    return { message: 'Doğrulama kodu tekrar gönderildi' };
  }
} 