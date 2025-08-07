import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

export function generateVerificationCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(username: string, email: string, password: string): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Kullanıcı adı veya email zaten kullanılıyor');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode(8);
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli
    const user = this.usersRepository.create({
      username,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
    });

    return this.usersRepository.save(user);
  }

  async setEmailVerified(userId: number): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpires: null,
    });
  }

  async updateEmailVerificationCode(userId: number, code: string, expires: Date): Promise<void> {
    await this.usersRepository.update(userId, {
      emailVerificationCode: code,
      emailVerificationExpires: expires,
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updatePassword(userId: number, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Mevcut şifre yanlış');
    }

    // Yeni şifrenin mevcut şifre ile aynı olup olmadığını kontrol et
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ConflictException('Yeni şifre mevcut şifre ile aynı olamaz');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await this.usersRepository.save(user);
  }

  async updateUsername(userId: number, newUsername: string): Promise<void> {
    const existingUser = await this.findByUsername(newUsername);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Bu kullanıcı adı zaten kullanılıyor');
    }

    await this.usersRepository.update(userId, { username: newUsername });
  }

  async updateProfilePhoto(userId: number, photoUrl: string): Promise<void> {
    await this.usersRepository.update(userId, { profilePhoto: photoUrl });
  }

  async initiateEmailChange(userId: number, newEmail: string): Promise<string> {
    const existingUser = await this.findByEmail(newEmail);
    if (existingUser) {
      throw new ConflictException('Bu email adresi zaten kullanılıyor');
    }

    const verificationCode = generateVerificationCode(8);
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli

    await this.usersRepository.update(userId, {
      newEmail,
      newEmailVerificationCode: verificationCode,
      newEmailVerificationExpires: verificationExpires,
    });

    return verificationCode;
  }

  async verifyNewEmail(userId: number, code: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (!user.newEmail || !user.newEmailVerificationCode || !user.newEmailVerificationExpires) {
      throw new ConflictException('Email değiştirme isteği bulunamadı');
    }

    if (user.newEmailVerificationCode !== code) {
      throw new ConflictException('Doğrulama kodu yanlış');
    }

    if (user.newEmailVerificationExpires < new Date()) {
      throw new ConflictException('Doğrulama kodunun süresi dolmuş');
    }

    await this.usersRepository.update(userId, {
      email: user.newEmail,
      isEmailVerified: true,
      newEmail: null,
      newEmailVerificationCode: null,
      newEmailVerificationExpires: null,
    });
  }

  async generatePasswordChangeToken(userId: number): Promise<string> {
    const token = generateVerificationCode(16);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli

    await this.usersRepository.update(userId, {
      passwordChangeToken: token,
      passwordChangeExpires: expires,
    });

    return token;
  }

  async changePasswordWithToken(token: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { passwordChangeToken: token }
    });

    if (!user) {
      throw new NotFoundException('Geçersiz token');
    }

    if (user.passwordChangeExpires < new Date()) {
      throw new ConflictException('Token süresi dolmuş');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(user.id, {
      password: hashedPassword,
      passwordChangeToken: null,
      passwordChangeExpires: null,
    });
  }
} 