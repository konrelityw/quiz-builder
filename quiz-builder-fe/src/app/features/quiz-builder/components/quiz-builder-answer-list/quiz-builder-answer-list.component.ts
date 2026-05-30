import {Component, computed, inject, input} from '@angular/core';
import {
  QuizBuilderAddAnswerButtonComponent
} from '../quiz-builder-add-answer-button/quiz-builder-add-answer-button.component';
import {QuizStoreService} from '../../../../services/quiz-store.service';
import {QuizBuilderAnswerForm} from '../quiz-builder-answer-form/quiz-builder-answer-form.component';

@Component({
  selector: 'quiz-builder-answer-list',
  templateUrl: './quiz-builder-answer-list.component.html',
  styleUrl: './quiz-builder-answer-list.component.scss',
  imports: [QuizBuilderAddAnswerButtonComponent, QuizBuilderAnswerForm],
})
export class QuizBuilderAnswerListComponent {
  readonly questionDisplayId = input.required<number>();
  private quizStore = inject(QuizStoreService);

  answers = computed(() => this.quizStore.getAnswers(this.questionDisplayId()));

  removeAnswer(answerDisplayId: number) {
    this.quizStore.removeAnswer(this.questionDisplayId(), answerDisplayId);
  }
}
