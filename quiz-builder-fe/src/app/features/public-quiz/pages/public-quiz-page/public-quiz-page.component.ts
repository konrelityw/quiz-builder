import {ChangeDetectorRef, Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {QuizApiService} from '../../../../services/quiz-api.service';
import {Question, Quiz} from '../../../../shared/entities/Quiz.entity';

@Component({
  selector: 'public-quiz-page',
  imports: [FormsModule],
  templateUrl: './public-quiz-page.component.html',
  styleUrl: './public-quiz-page.component.scss',
})
export class PublicQuizPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly quizApiService = inject(QuizApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  quiz: Quiz | null = null;
  status = 'Loading quiz...';
  submitStatus = '';
  selectedAnswers: Record<number, number[]> = {};
  currentQuestionIndex = 0;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const quizId = params.get('id');

      if (!quizId) {
        this.status = 'Quiz id is missing in link';
        return;
      }

      this.loadQuiz(quizId);
    });
  }

  private loadQuiz(quizId: string) {
    this.status = 'Loading quiz...';
    this.submitStatus = '';
    this.selectedAnswers = {};
    this.currentQuestionIndex = 0;

    this.quizApiService.getPublicQuizById(quizId).subscribe({
      next: (quiz) => {
        try {
          this.status = '';
          this.quiz = {
            ...quiz,
            questions: Array.isArray(quiz.questions) ? quiz.questions : [],
            combinations: Array.isArray(quiz.combinations) ? quiz.combinations : [],
          };
          this.cdr.detectChanges();
        } catch {
          this.quiz = null;
          this.status = 'Failed to render quiz';
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.quiz = null;
        this.status = 'Failed to load quiz';
        this.cdr.detectChanges();
      },
    });
  }

  private isMulti(question: Question) {
    return question.type === 'multi';
  }

  toggleAnswer(question: Question, answerDisplayId: number) {
    const qid = question.displayId;
    if (this.isMulti(question)) {
      const current = this.selectedAnswers[qid] ?? [];
      const set = new Set(current);
      if (set.has(answerDisplayId)) {
        set.delete(answerDisplayId);
      } else {
        set.add(answerDisplayId);
      }
      const next = [...set].sort((a, b) => a - b);
      if (next.length === 0) {
        const updated = {...this.selectedAnswers};
        delete updated[qid];
        this.selectedAnswers = updated;
      } else {
        this.selectedAnswers = {...this.selectedAnswers, [qid]: next};
      }
    } else {
      this.selectedAnswers = {...this.selectedAnswers, [qid]: [answerDisplayId]};
    }
  }

  isAnswerSelected(questionDisplayId: number, answerDisplayId: number) {
    return (this.selectedAnswers[questionDisplayId] ?? []).includes(answerDisplayId);
  }

  get questionsCount() {
    return this.quiz?.questions?.length ?? 0;
  }

  get currentQuestion() {
    if (!this.quiz?.questions?.length) {
      return null;
    }

    return this.quiz.questions[this.currentQuestionIndex] ?? null;
  }

  get isLastQuestion() {
    return this.currentQuestionIndex >= this.questionsCount - 1;
  }

  get progressPercent() {
    if (!this.questionsCount) {
      return 0;
    }

    return ((this.currentQuestionIndex + 1) / this.questionsCount) * 100;
  }

  protected isCurrentQuestionAnswered() {
    const question = this.currentQuestion;
    if (!question) {
      return false;
    }

    const selected = this.selectedAnswers[question.displayId];
    return Array.isArray(selected) && selected.length > 0;
  }

  goToPreviousQuestion() {
    if (this.currentQuestionIndex === 0) {
      return;
    }

    this.submitStatus = '';
    this.currentQuestionIndex -= 1;
  }

  goToNextQuestion() {
    if (!this.currentQuestion) {
      return;
    }

    if (!this.isCurrentQuestionAnswered()) {
      this.submitStatus = this.currentQuestion?.type === 'multi'
        ? 'Select at least one answer to continue'
        : 'Please select an answer to continue';
      return;
    }

    this.submitStatus = '';
    if (this.currentQuestionIndex < this.questionsCount - 1) {
      this.currentQuestionIndex += 1;
    }
  }

  private normalizeResultUrl(url: string) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return '';
    }

    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
  }

  submitQuiz() {
    if (!this.quiz || !this.currentQuestion) {
      return;
    }

    if (!this.isLastQuestion) {
      this.submitStatus = 'Go to the last question to get recommendation';
      return;
    }

    if (!this.isCurrentQuestionAnswered()) {
      this.submitStatus = this.currentQuestion?.type === 'multi'
        ? 'Select at least one answer to continue'
        : 'Please select an answer to continue';
      return;
    }

    const questions = this.quiz.questions ?? [];
    const selectedAnswers: { questionDisplayId: number; answerDisplayId: number }[] = [];
    for (const question of questions) {
      for (const answerDisplayId of this.selectedAnswers[question.displayId] ?? []) {
        selectedAnswers.push({questionDisplayId: question.displayId, answerDisplayId});
      }
    }

    this.submitStatus = 'Preparing recommendation...';
    this.quizApiService.submitPublicQuiz(this.quiz._id, selectedAnswers).subscribe({
      next: ({resultUrl}) => {
        const targetUrl = this.normalizeResultUrl(resultUrl);
        if (!targetUrl) {
          this.submitStatus = 'No result configured for this answer set';
          return;
        }
        window.location.assign(targetUrl);
      },
      error: () => {
        this.submitStatus = 'Failed to get recommendation';
      },
    });
  }
}
