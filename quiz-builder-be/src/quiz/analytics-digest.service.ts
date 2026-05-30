import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MailService } from '../mail/mail.service';
import { User, UserDocument } from '../user/user.schema';
import { QuizService } from './quiz.service';

const DIGEST_JOB_NAME = 'quizAnalyticsDigest';
const MS_PER_DAY = 86400000;

@Injectable()
export class AnalyticsDigestService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsDigestService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly quizService: QuizService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    if (this.schedulerRegistry.doesExist('cron', DIGEST_JOB_NAME)) {
      this.schedulerRegistry.deleteCronJob(DIGEST_JOB_NAME);
    }

    if (this.configService.get<string>('STATS_EMAIL_ENABLED') === 'false') {
      this.logger.log('Scheduled analytics digest is disabled (STATS_EMAIL_ENABLED=false).');
      return;
    }

    const cronExpression =
      this.configService.get<string>('STATS_CRON')?.trim() || '0 9 * * *';
    const sendIfEmpty = this.configService.get<string>('STATS_DIGEST_SEND_IF_EMPTY') === 'true';

    const job = new CronJob(cronExpression, () => {
      void this.runDigest(sendIfEmpty);
    });
    this.schedulerRegistry.addCronJob(DIGEST_JOB_NAME, job);
    job.start();

    this.logger.log(
      `Scheduled analytics digest registered: "${cronExpression}" (STATS_DIGEST_SEND_IF_EMPTY=${sendIfEmpty}).`,
    );
  }

  async runDigest(sendIfEmpty: boolean) {
    if (this.configService.get<string>('STATS_EMAIL_ENABLED') === 'false') {
      return;
    }

    const now = new Date();

    const users = await this.userModel
      .find({
        emailVerified: true,
        email: { $exists: true, $nin: [null, ''] },
        analyticsDigestFrequency: { $in: ['hourly', 'daily', 'weekly', 'monthly'] },
      })
      .exec();

    if (!users.length) {
      this.logger.log(
        'Analytics digest tick: no users opted in (hourly/daily/weekly/monthly) with verified email.',
      );
      return;
    }

    let sent = 0;
    let skippedNoQuizzes = 0;
    let skippedBySchedule = 0;

    for (const user of users) {
      try {
        if (!this.shouldSendDigest(user.analyticsDigestFrequency, user.analyticsDigestLastSentAt, now)) {
          skippedBySchedule += 1;
          continue;
        }

        const periodFrom = user.analyticsDigestLastSentAt ?? new Date(0);
        const periodCaption = user.analyticsDigestLastSentAt
          ? this.mailService.formatDigestPeriodCaption(periodFrom, now)
          : 'All submissions stored in the system (first digest — period matches lifetime until the next email).';

        const sections = await this.quizService.buildWeeklyDigestSectionsForUser(
          user._id.toString(),
          periodFrom,
          now,
          periodCaption,
        );

        if (!sections.length) {
          if (sendIfEmpty) {
            await this.mailService.sendWeeklyDigestEmail(user.email!, [
              '<p>You have no quizzes yet. This is your scheduled digest (STATS_DIGEST_SEND_IF_EMPTY=true).</p>',
            ]);
            await this.userModel
              .findByIdAndUpdate(user._id, { analyticsDigestLastSentAt: new Date() })
              .exec();
            sent += 1;
          } else {
            skippedNoQuizzes += 1;
          }
          continue;
        }

        await this.mailService.sendWeeklyDigestEmail(user.email!, sections);
        await this.userModel
          .findByIdAndUpdate(user._id, { analyticsDigestLastSentAt: new Date() })
          .exec();
        sent += 1;
      } catch (error) {
        this.logger.warn(`Digest failed for ${user.email}: ${String(error)}`);
      }
    }

    this.logger.log(
      `Analytics digest tick: ${users.length} opted-in user(s), ${sent} email(s) sent, ${skippedBySchedule} skipped (not due yet), ${skippedNoQuizzes} skipped (no quizzes; STATS_DIGEST_SEND_IF_EMPTY=true to email anyway).`,
    );
  }

  private isSameUtcCalendarDay(a: Date, b: Date): boolean {
    return (
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate()
    );
  }

  private isSameUtcHour(a: Date, b: Date): boolean {
    return this.isSameUtcCalendarDay(a, b) && a.getUTCHours() === b.getUTCHours();
  }

  private shouldSendDigest(
    frequency: string | undefined,
    lastSent: Date | undefined,
    now: Date,
  ): boolean {
    const freq = frequency ?? 'off';
    if (freq === 'off') {
      return false;
    }
    if (!lastSent) {
      return true;
    }
    const elapsed = now.getTime() - lastSent.getTime();
    if (freq === 'hourly') {
      return !this.isSameUtcHour(lastSent, now);
    }
    if (freq === 'daily') {
      return !this.isSameUtcCalendarDay(lastSent, now);
    }
    if (freq === 'weekly') {
      return elapsed >= 7 * MS_PER_DAY;
    }
    if (freq === 'monthly') {
      return elapsed >= 30 * MS_PER_DAY;
    }
    return false;
  }
}
