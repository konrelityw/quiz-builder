import { Expose } from 'class-transformer';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

import { ANALYTICS_DIGEST_FREQUENCIES } from './user.schema';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(10)
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(10)
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateEmailDto {
  @IsEmail()
  newEmail: string;

  @IsString()
  @MinLength(6)
  currentPassword: string;
}

export class UpdateAnalyticsDigestDto {
  @IsIn([...ANALYTICS_DIGEST_FREQUENCIES])
  frequency: (typeof ANALYTICS_DIGEST_FREQUENCIES)[number];
}

export class UserResponseModel {
  @Expose()
  username: string;

  @Expose()
  email?: string;

  @Expose()
  emailVerified?: boolean;
}
