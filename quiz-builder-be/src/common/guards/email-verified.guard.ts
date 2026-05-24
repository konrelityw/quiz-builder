import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { email?: string; emailVerified?: boolean } }>();
    const user = request.user;
    if (!user?.email) {
      return true;
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email using the link we sent before using the quiz builder.',
      );
    }
    return true;
  }
}
