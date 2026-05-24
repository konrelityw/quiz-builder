import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { Strategy } from 'passport-local';

import { UserResponseModel } from 'src/user/auth.dtos';
import { UserNotFoundException } from 'src/user/user.exceptions';
import { User, UserDocument } from 'src/user/user.schema';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super();
  }

  async validate(
    username: string,
    password: string,
  ): Promise<UserResponseModel> {
    const trimmed = username?.trim() ?? '';
    const asEmail = trimmed.toLowerCase();

    const user = await this.userModel
      .findOne({
        $or: [{ username: trimmed }, { email: asEmail }],
      })
      .exec();

    if (!user) {
      throw new UserNotFoundException(`username: ${username}`);
    }

    const isPasswordValid = await user.verifyPassword(password);

    if (!user.password || !isPasswordValid) {
      throw new HttpException(
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...secureUser } = user.toObject();
    return secureUser;
  }
}
