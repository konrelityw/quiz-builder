import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuizApiService } from '../../../../services/quiz-api.service';
import { QuizAnalytics, QuizAnswerStat } from '../../../../shared/entities/Quiz.entity';

interface GroupedQuestionStats {
  questionDisplayId: number;
  questionTitle: string;
  answers: QuizAnswerStat[];
}

@Component({
  selector: 'quiz-analytics-page',
  imports: [RouterLink],
  templateUrl: './quiz-analytics-page.component.html',
  styleUrl: './quiz-analytics-page.component.scss',
})
export class QuizAnalyticsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly quizApiService = inject(QuizApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  analytics: QuizAnalytics | null = null;
  status = 'Loading analytics...';
  emailStatus = '';
  quizId = '';

  get groupedAnswerStats(): GroupedQuestionStats[] {
    if (!this.analytics?.answerStats?.length) {
      return [];
    }

    const groups = new Map<number, GroupedQuestionStats>();

    for (const answerStat of this.analytics.answerStats) {
      const existingGroup = groups.get(answerStat.questionDisplayId);
      if (existingGroup) {
        existingGroup.answers.push(answerStat);
        continue;
      }

      groups.set(answerStat.questionDisplayId, {
        questionDisplayId: answerStat.questionDisplayId,
        questionTitle: answerStat.questionTitle,
        answers: [answerStat],
      });
    }

    return Array.from(groups.values()).sort((left, right) => left.questionDisplayId - right.questionDisplayId);
  }

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.quizId = id ?? '';
      if (!id) {
        this.status = 'Quiz id is missing in link';
        this.analytics = null;
        return;
      }

      this.loadAnalytics(id);
    });
  }

  sendAnalyticsEmail(quizId: string) {
    this.emailStatus = 'Sending email...';
    this.quizApiService.emailQuizAnalytics(quizId).subscribe({
      next: () => {
        this.emailStatus = 'Report sent to your verified email address.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.emailStatus = 'Could not send email. Ensure your email is verified in Account.';
        this.cdr.detectChanges();
      },
    });
  }

  private loadAnalytics(quizId: string) {
    this.status = 'Loading analytics...';
    this.emailStatus = '';
    this.quizApiService.getQuizAnalytics(quizId).subscribe({
      next: (analytics) => {
        try {
          this.analytics = {
            ...analytics,
            resultStats: Array.isArray(analytics.resultStats) ? analytics.resultStats : [],
            answerStats: Array.isArray(analytics.answerStats) ? analytics.answerStats : [],
          };
          this.status = '';
          this.cdr.detectChanges();
        } catch {
          this.analytics = null;
          this.status = 'Failed to render analytics';
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.analytics = null;
        this.status = 'Failed to load analytics';
        this.cdr.detectChanges();
      },
    });
  }
}
