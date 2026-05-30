import {Component, effect, inject, input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {QuizStoreService} from '../../../../services/quiz-store.service';

@Component({
  selector: 'quiz-builder-answer-form',
  templateUrl: './quiz-builder-answer-form.component.html',
  styleUrl: './quiz-builder-answer-form.component.scss',
  imports: [ReactiveFormsModule],
  providers: [FormBuilder],
})
export class QuizBuilderAnswerForm {
  readonly questionDisplayId = input.required<number>();
  readonly answerDisplayId = input.required<number>();
  private readonly quizStore = inject(QuizStoreService);
  private readonly formBuilder = inject(FormBuilder);

  answerForm = this.formBuilder.group({
    title: this.formBuilder.control('', {nonNullable: true, validators: [Validators.required]}),
    subtitle: this.formBuilder.control(''),
  });

  constructor() {
    effect(() => {
      const answer = this.quizStore.getAnswer(this.questionDisplayId(), this.answerDisplayId());
      if (!answer) return;

      this.answerForm.patchValue(
        {
          title: answer.title,
          subtitle: answer.subtitle ?? '',
        },
        {emitEvent: false},
      );
    });

    this.answerForm.valueChanges.subscribe((value) => {
      this.quizStore.updateAnswer(this.questionDisplayId(), this.answerDisplayId(), {
        title: value.title ?? undefined,
        subtitle: value.subtitle ?? undefined,
      });
    });
  }
}
