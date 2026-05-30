import {Component, inject, input} from '@angular/core';
import {QuizStoreService} from '../../../../services/quiz-store.service';

@Component({
  selector: 'quiz-builder-add-answer-button',
  templateUrl: './quiz-builder-add-answer-button.component.html',
  styleUrl: './quiz-builder-add-answer-button.component.scss',
})
export class QuizBuilderAddAnswerButtonComponent {
  readonly questionDisplayId = input.required<number>();
  private readonly quizStore = inject(QuizStoreService);

  onAdd() {
    this.quizStore.addAnswer(this.questionDisplayId(), {title: ''});
  }
}
