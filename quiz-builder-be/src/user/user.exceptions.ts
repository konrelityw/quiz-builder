import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor(...args: unknown[]) {
    super(`User with ${args} not found`, HttpStatus.NOT_FOUND);
  }
}
