import { Controller, Post, Body, UseGuards, Request, Get, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto, ChangePasswordDto, UpdateProfileDto, ChangeEmailDto, VerifyNewEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePhoto: user.profilePhoto,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/username')
  async updateUsername(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    await this.usersService.updateUsername(req.user.id, updateProfileDto.username);
    return { message: 'Kullanıcı adı başarıyla güncellendi' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/photo')
  async updateProfilePhoto(@Request() req, @Body() body: { photoUrl: string }) {
    await this.usersService.updateProfilePhoto(req.user.id, body.photoUrl);
    return { message: 'Profil fotoğrafı başarıyla güncellendi' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Şifre başarıyla değiştirildi' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(@Request() req, @Body() changeEmailDto: ChangeEmailDto) {
    const verificationCode = await this.usersService.initiateEmailChange(req.user.id, changeEmailDto.newEmail);
    
    // Email gönderme işlemi
    await this.mailService.sendEmailVerification(changeEmailDto.newEmail, verificationCode);
    
    return { message: 'Doğrulama kodu yeni email adresinize gönderildi' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-new-email')
  async verifyNewEmail(@Request() req, @Body() verifyNewEmailDto: VerifyNewEmailDto) {
    await this.usersService.verifyNewEmail(req.user.id, verifyNewEmailDto.code);
    return { message: 'Email adresi başarıyla değiştirildi' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendEmailVerification(body.email);
  }

  @Post('resend-email-verification')
  async resendEmailVerification(@Body() body: { email: string }) {
    return this.authService.resendEmailVerification(body.email);
  }
} 