import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Kullanıcı adı bir metin olmalıdır' })
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter uzunluğunda olmalıdır' })
  username: string;

  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  email: string;

  @IsString({ message: 'Şifre bir metin olmalıdır' })
  @MinLength(6, { message: 'Şifre en az 6 karakter uzunluğunda olmalıdır' })
  password: string;
}

export class LoginDto {
  @IsString({ message: 'Kullanıcı adı bir metin olmalıdır' })
  username: string;

  @IsString({ message: 'Şifre bir metin olmalıdır' })
  password: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'Mevcut şifre bir metin olmalıdır' })
  currentPassword: string;

  @IsString({ message: 'Yeni şifre bir metin olmalıdır' })
  @MinLength(6, { message: 'Yeni şifre en az 6 karakter uzunluğunda olmalıdır' })
  newPassword: string;
}

export class UpdateProfileDto {
  @IsString({ message: 'Kullanıcı adı bir metin olmalıdır' })
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter uzunluğunda olmalıdır' })
  username: string;
}

export class ChangeEmailDto {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  newEmail: string;
}

export class VerifyNewEmailDto {
  @IsString({ message: 'Doğrulama kodu bir metin olmalıdır' })
  code: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  email: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'Token bir metin olmalıdır' })
  token: string;

  @IsString({ message: 'Şifre bir metin olmalıdır' })
  @MinLength(6, { message: 'Şifre en az 6 karakter uzunluğunda olmalıdır' })
  newPassword: string;
} 