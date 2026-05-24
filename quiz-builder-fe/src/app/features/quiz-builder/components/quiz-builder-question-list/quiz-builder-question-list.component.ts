import { Component, computed, inject } from '@angular/core';
import { QuizBuilderAddQuestionButtonComponent } from '../quiz-builder-add-question-button/quiz-builder-add-question-button.component';
import { QuizStoreService } from '../../../../services/quiz-store.service';
import { QuizBuilderQuestionForm } from '../quiz-builder-question-form/quiz-builder-question-form.component';

@Component({
  selector: 'quiz-builder-question-list',
  templateUrl: './quiz-builder-question-list.component.html',
  styleUrl: './quiz-builder-question-list.component.scss',
  imports: [QuizBuilderAddQuestionButtonComponent, QuizBuilderQuestionForm],
})
export class QuizBuilderQuestionListComponent {
  private quizStore = inject(QuizStoreService);

  questions = computed(() => this.quizStore.quiz().questions);

  moveQuestionUp(index: number) {
    if (index <= 0) return;
    this.quizStore.moveQuestion(index, index - 1);
  }

  moveQuestionDown(index: number) {
    const list = this.questions();
    if (index < 0 || index >= list.length - 1) return;
    this.quizStore.moveQuestion(index, index + 1);
  }
}
