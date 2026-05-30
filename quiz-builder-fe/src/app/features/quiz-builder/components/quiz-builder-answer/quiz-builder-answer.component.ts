import {Component, inject} from '@angular/core';
import {QuizStoreService} from '../../../../services/quiz-store.service';

@Component({
  selector: 'quiz-builder-answer',
  templateUrl: './quiz-builder-answer.component.html',
  styleUrl: './quiz-builder-answer.component.scss',
})
export class QuizBuilderAnswerComponent {
  readonly quizStoreService = inject(QuizStoreService);
}
