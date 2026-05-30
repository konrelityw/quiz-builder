import {Component, inject, input} from '@angular/core';

@Component({
  selector: 'quiz-builder-question',
  templateUrl: './quiz-builder-question.component.html',
  styleUrl: './quiz-builder-question.component.scss',
})
export class QuizBuilderQuestionComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
