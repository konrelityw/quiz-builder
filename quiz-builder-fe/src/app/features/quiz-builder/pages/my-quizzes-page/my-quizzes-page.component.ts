import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizApiService } from '../../../../services/quiz-api.service';
import { Quiz } from '../../../../shared/entities/Quiz.entity';

@Component({
  selector: 'my-quizzes-page',
  imports: [RouterLink],
  templateUrl: './my-quizzes-page.component.html',
  styleUrl: './my-quizzes-page.component.scss',
})
export class MyQuizzesPageComponent {
  private readonly quizApiService = inject(QuizApiService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  quizzes: Quiz[] = [];
  status = '';

  constructor() {
    this.loadQuizzes();
  }

  loadQuizzes() {
    this.status = 'Loading quizzes...';
    this.quizApiService.getMyQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes = Array.isArray(quizzes) ? quizzes : [];
        this.status = this.quizzes.length ? '' : 'No quizzes yet';
        this.cdr.markForCheck();
      },
      error: () => {
        this.status = 'Failed to load quizzes';
        this.cdr.markForCheck();
      },
    });
  }

  updateQuiz(quizId: string) {
    this.router.navigate(['/quiz-builder', quizId]);
  }

  deleteQuiz(quizId: string) {
    this.status = 'Deleting quiz...';
    this.quizApiService.deleteQuiz(quizId).subscribe({
      next: () => {
        this.quizzes = this.quizzes.filter((quiz) => quiz._id !== quizId);
        this.status = this.quizzes.length ? '' : 'No quizzes yet';
        this.cdr.markForCheck();
      },
      error: () => {
        this.status = 'Failed to delete quiz';
        this.cdr.markForCheck();
      },
    });
  }
}
