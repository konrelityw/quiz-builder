import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MailModule } from '../mail/mail.module';
import { User, UserSchema } from '../user/user.schema';
import { AnalyticsDigestService } from './analytics-digest.service';
import { QuizController } from './quiz.controller';
import { QuizResult, QuizResultSchema } from './quiz-result.schema';
import { Quiz, QuizSchema } from './quiz.schema';
import { QuizService } from './quiz.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizResult.name, schema: QuizResultSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MailModule,
  ],
  controllers: [QuizController],
  providers: [QuizService, AnalyticsDigestService],
})
export class QuizModule {}
