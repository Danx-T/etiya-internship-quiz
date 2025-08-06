import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Gmail SMTP ayarları
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      secure: true,
      port: 465
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
      
      console.log('Email gönderiliyor...');
      console.log('To:', email);
      console.log('From:', process.env.EMAIL_USER);
      console.log('Reset URL:', resetUrl);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Şifre Sıfırlama - Quiz Uygulaması',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Şifre Sıfırlama</h2>
            <p style="color: #666; line-height: 1.6;">
              Quiz uygulaması için şifre sıfırlama talebinde bulundunuz.
            </p>
            <p style="color: #666; line-height: 1.6;">
              Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Şifremi Sıfırla
              </a>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
              Bu link 1 saat geçerlidir.
            </p>
            <p style="color: #999; font-size: 14px; text-align: center;">
              Eğer bu isteği siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email başarıyla gönderildi!');
    } catch (error) {
      console.error('❌ Email gönderme hatası:', error);
      throw error;
    }
  }

  async sendEmailVerification(email: string, code: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'E-posta Doğrulama - Quiz Uygulaması',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">E-posta Doğrulama</h2>
            <p style="color: #666; line-height: 1.6;">
              Kayıt işlemini tamamlamak için aşağıdaki doğrulama kodunu kullanın:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 2em; letter-spacing: 4px; background: #f3f3f3; padding: 10px 20px; border-radius: 8px; display: inline-block; font-weight: bold;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
              Bu kod 10 dakika geçerlidir.
            </p>
          </div>
        `,
      };
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email doğrulama kodu gönderildi!');
    } catch (error) {
      console.error('❌ Email doğrulama kodu gönderme hatası:', error);
      throw error;
    }
  }
} 