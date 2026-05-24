import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SecurityModule } from 'src/common/security/security.module';

import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from './user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    SecurityModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class UserModule {}
