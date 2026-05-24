import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  UpdateAnalyticsDigestDto,
  UpdateEmailDto,
  VerifyEmailDto,
} from './auth.dtos';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { UserDocument } from './user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: { user: UserDocument }) {
    return this.authService.me(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(@Request() req: { user: UserDocument }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user._id.toString(), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('email')
  updateEmail(@Request() req: { user: UserDocument }, @Body() dto: UpdateEmailDto) {
    return this.authService.updateEmail(req.user._id.toString(), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('analytics-digest')
  updateAnalyticsDigest(
    @Request() req: { user: UserDocument },
    @Body() dto: UpdateAnalyticsDigestDto,
  ) {
    return this.authService.updateAnalyticsDigest(req.user._id.toString(), dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: UserDocument }) {
    return this.authService.login(req.user);
  }
}
