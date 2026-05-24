import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface QuizAnalyticsMailPayload {
  quizName: string;
  totalSubmissions: number;
  resultStats: { resultUrl: string; count: number }[];
  answerStats: {
    questionTitle: string;
    answerTitle: string;
    count: number;
  }[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const passRaw = this.configService.get<string>('SMTP_PASS') ?? '';
    const pass = passRaw.replace(/\s+/g, '');
    const name = this.configService.get<string>('MAIL_FROM_NAME') ?? 'QuizBuilder';
    const address =
      this.configService.get<string>('MAIL_FROM_ADDRESS') ?? user ?? 'noreply@localhost';

    this.fromAddress = `"${name}" <${address}>`;
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    this.enabled = Boolean(host && user && pass);

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configured (${host}:${port})`);
    } else {
      this.transporter = null;
      this.logger.warn(
        'SMTP not fully configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be logged only.',
      );
    }
  }

  private async send(to: string, subject: string, text: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(`[email skipped — no SMTP] To: ${to}\nSubject: ${subject}\n${text}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${String(error)}`);
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const link = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your email — QuizBuilder';
    const text = `Welcome! Please verify your email by opening this link:\n${link}\n\nIf you did not sign up for QuizBuilder, you can ignore this message.`;
    const html = `<p>Welcome!</p><p>Please verify your email by clicking the link below:</p><p><a href="${link}">${link}</a></p><p>If you did not sign up for QuizBuilder, you can ignore this message.</p>`;
    await this.send(to, subject, text, html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const link = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Reset your password — QuizBuilder';
    const text = `To set a new password, open this link:\n${link}\n\nThis link expires after a short time. If you did not request a reset, ignore this message.`;
    const html = `<p>To set a new password, open this link:</p><p><a href="${link}">${link}</a></p><p>This link expires after a short time. If you did not request a reset, ignore this message.</p>`;
    await this.send(to, subject, text, html);
  }

  formatDigestPeriodCaption(from: Date, to: Date): string {
    return `Submissions with createdAt from ${from.toISOString()} through ${to.toISOString()} (UTC).`;
  }

  private renderAnalyticsTables(payload: QuizAnalyticsMailPayload): string {
    const resultRows = payload.resultStats.length
      ? payload.resultStats
          .map(
            (r) =>
              `<tr><td style="padding:6px;border:1px solid #ddd;"><a href="${this.escapeHtml(r.resultUrl)}">${this.escapeHtml(r.resultUrl)}</a></td><td style="padding:6px;border:1px solid #ddd;">${r.count}</td></tr>`,
          )
          .join('')
      : '<tr><td colspan="2" style="padding:6px;border:1px solid #ddd;">No data</td></tr>';

    const answerRows = payload.answerStats.length
      ? payload.answerStats
          .map(
            (a) =>
              `<tr><td style="padding:6px;border:1px solid #ddd;">${this.escapeHtml(a.questionTitle)}</td><td style="padding:6px;border:1px solid #ddd;">${this.escapeHtml(a.answerTitle)}</td><td style="padding:6px;border:1px solid #ddd;">${a.count}</td></tr>`,
          )
          .join('')
      : '<tr><td colspan="3" style="padding:6px;border:1px solid #ddd;">No data</td></tr>';

    return `
      <p><strong>Total submissions:</strong> ${payload.totalSubmissions}</p>
      <h4 style="margin:12px 0 6px;">Results (URLs)</h4>
      <table style="border-collapse:collapse;width:100%;max-width:640px;"><thead><tr><th style="text-align:left;padding:6px;border:1px solid #ddd;">URL</th><th style="padding:6px;border:1px solid #ddd;">Count</th></tr></thead><tbody>${resultRows}</tbody></table>
      <h4 style="margin:12px 0 6px;">Answer distribution</h4>
      <table style="border-collapse:collapse;width:100%;max-width:640px;"><thead><tr><th style="text-align:left;padding:6px;border:1px solid #ddd;">Question</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Answer</th><th style="padding:6px;border:1px solid #ddd;">Count</th></tr></thead><tbody>${answerRows}</tbody></table>
    `;
  }

  formatDigestQuizSection(
    overall: QuizAnalyticsMailPayload,
    period: QuizAnalyticsMailPayload,
    periodCaption: string,
  ): string {
    const name = this.escapeHtml(overall.quizName);
    return `
      <h2 style="margin:16px 0 8px;">${name}</h2>
      <h3 style="margin:12px 0 6px;color:#1e293b;">All-time (lifetime)</h3>
      ${this.renderAnalyticsTables(overall)}
      <h3 style="margin:16px 0 6px;color:#1e293b;">Since your previous digest email</h3>
      <p style="margin:0 0 10px;color:#64748b;font-size:13px;">${this.escapeHtml(periodCaption)}</p>
      ${this.renderAnalyticsTables(period)}
    `;
  }

  async sendQuizAnalyticsEmail(
    to: string,
    overall: QuizAnalyticsMailPayload,
    period: QuizAnalyticsMailPayload,
    periodCaption: string,
  ) {
    const subject = `Quiz analytics: ${overall.quizName} — QuizBuilder`;
    const section = this.formatDigestQuizSection(overall, period, periodCaption);
    const html = `<p>QuizBuilder analytics for <strong>${this.escapeHtml(overall.quizName)}</strong>:</p>${section}`;
    const text = `${overall.quizName}\nAll-time submissions: ${overall.totalSubmissions}\nPeriod submissions: ${period.totalSubmissions}\n(Open the HTML version for full tables.)`;
    await this.send(to, subject, text, html);
  }

  async sendWeeklyDigestEmail(to: string, sectionsHtml: string[]) {
    const subject = 'Scheduled quiz analytics — QuizBuilder';
    const html = `<p>Here is your scheduled quiz analytics from QuizBuilder. Each quiz includes <strong>all-time</strong> totals and activity <strong>since your previous digest email</strong> (see the period note under each quiz).</p>${sectionsHtml.join('<hr style="margin:24px 0;" />')}`;
    const text = 'Open the HTML version of this email for all-time and period analytics tables.';
    await this.send(to, subject, text, html);
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
