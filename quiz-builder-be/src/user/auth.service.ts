import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

import { MailService } from '../mail/mail.service';
import { User, UserDocument } from './user.schema';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateAnalyticsDigestDto,
  UpdateEmailDto,
  VerifyEmailDto,
} from './auth.dtos';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const usernameTaken = await this.userModel.findOne({ username: dto.username });
    if (usernameTaken) {
      throw new ConflictException('Username already taken');
    }

    const emailTaken = await this.userModel.findOne({ email });
    if (emailTaken) {
      throw new ConflictException('Email already registered');
    }

    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await new this.userModel({
      username: dto.username,
      password: dto.password,
      email,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    }).save();

    await this.mailService.sendVerificationEmail(email, emailVerificationToken);

    this.logger.log(`User registered (pending email): ${dto.username}`);
    return {
      message: 'Registration successful. Check your inbox and verify your email.',
      email,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userModel.findOne({
      emailVerificationToken: dto.token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified. You can sign in now.' };
  }

  async resendVerification(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.userModel.findOne({ email });

    if (!user || user.emailVerified) {
      return {
        message:
          'If an account exists and the email is not verified yet, we sent a new confirmation link.',
      };
    }

    const emailVerificationToken = randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await user.save();

    await this.mailService.sendVerificationEmail(email, emailVerificationToken);
    return { message: 'Verification email sent.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email });

    if (!user) {
      return {
        message:
          'If an account exists for this email, we sent password reset instructions.',
      };
    }

    const passwordResetToken = randomBytes(32).toString('hex');
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await this.mailService.sendPasswordResetEmail(email, passwordResetToken);
    return {
      message:
        'If an account exists for this email, we sent password reset instructions.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      passwordResetToken: dto.token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    user.password = dto.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password updated. You can sign in with the new password.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const valid = await user.verifyPassword(dto.currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.password = dto.newPassword;
    await user.save();
    return { message: 'Password changed.' };
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const valid = await user.verifyPassword(dto.currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const newEmail = dto.newEmail.trim().toLowerCase();
    const current = user.email?.trim().toLowerCase();
    if (current === newEmail) {
      throw new BadRequestException('This email is already set on your account.');
    }

    const taken = await this.userModel.findOne({ email: newEmail, _id: { $ne: user._id } });
    if (taken) {
      throw new ConflictException('This email is already used by another account.');
    }

    const emailVerificationToken = randomBytes(32).toString('hex');
    user.email = newEmail;
    user.emailVerified = false;
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await user.save();

    await this.mailService.sendVerificationEmail(newEmail, emailVerificationToken);

    return {
      message:
        'Email updated. Check the new inbox and verify your email to use the quiz builder again.',
      email: newEmail,
      emailVerified: false,
    };
  }

  async me(user: UserDocument) {
    return {
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      analyticsDigestFrequency: user.analyticsDigestFrequency ?? 'off',
    };
  }

  async updateAnalyticsDigest(userId: string, dto: UpdateAnalyticsDigestDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    user.analyticsDigestFrequency = dto.frequency;
    await user.save();
    return {
      message: 'Analytics email preference saved.',
      analyticsDigestFrequency: user.analyticsDigestFrequency,
    };
  }

  login(user: UserDocument) {
    if (user.email && !user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email using the link we sent before signing in.',
      );
    }
    return this.signToken(user);
  }

  private signToken(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      emailVerified: user.emailVerified ?? false,
    };
    return {
      access_token: this.jwtService.sign(payload),
      emailVerified: user.emailVerified ?? false,
      email: user.email,
    };
  }
}
