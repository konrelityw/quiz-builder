import { Component, inject } from '@angular/core';
import { QuizStoreService } from '../../../../services/quiz-store.service';

@Component({
  selector: 'quiz-builder-add-question-button',
  templateUrl: './quiz-builder-add-question-button.component.html',
  styleUrl: './quiz-builder-add-question-button.component.scss',
})
export class QuizBuilderAddQuestionButtonComponent {
  readonly quizStoreService = inject(QuizStoreService);

  onAdd() {
    this.quizStoreService.addQuestion({ title: '', answers: [], type: 'single', affectsMatching: true });
  }
}
