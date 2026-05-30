import {Component, effect, inject, input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {QuizStoreService} from '../../../../services/quiz-store.service';
import {QuizBuilderAnswerListComponent} from '../quiz-builder-answer-list/quiz-builder-answer-list.component';

@Component({
  selector: 'quiz-builder-question-form',
  templateUrl: './quiz-builder-question-form.component.html',
  styleUrl: './quiz-builder-question-form.component.scss',
  imports: [ReactiveFormsModule, QuizBuilderAnswerListComponent],
  providers: [FormBuilder],
})
export class QuizBuilderQuestionForm {
  readonly displayId = input.required<number>();
  private readonly quizStore = inject(QuizStoreService);
  private readonly formBuilder = inject(FormBuilder);

  questionForm = this.formBuilder.group({
    questionDisplayId: this.formBuilder.control(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    title: this.formBuilder.control('', {nonNullable: true, validators: [Validators.required]}),
    subtitle: this.formBuilder.control(''),
    type: this.formBuilder.control<'single' | 'multi'>('single', {nonNullable: true}),
    affectsMatching: this.formBuilder.control(true, {nonNullable: true}),
  });

  constructor() {
    effect(() => {
      const question = this.quizStore.getQuestion(this.displayId());
      if (!question) return;

      this.questionForm.patchValue(
        {
          questionDisplayId: question.displayId,
          title: question.title,
          subtitle: question.subtitle ?? '',
          type: question.type === 'multi' ? 'multi' : 'single',
          affectsMatching: question.affectsMatching !== false,
        },
        {emitEvent: false},
      );
    });

    this.questionForm.valueChanges.subscribe((value) => {
      const rawId = value.questionDisplayId;
      let nextDisplayId = this.displayId();
      if (typeof rawId === 'number' && Number.isFinite(rawId) && rawId >= 0) {
        nextDisplayId = Math.floor(rawId);
      }

      this.quizStore.updateQuestion(this.displayId(), {
        displayId: nextDisplayId,
        title: value.title ?? undefined,
        subtitle: value.subtitle ?? undefined,
        type: value.type ?? 'single',
        affectsMatching: value.affectsMatching,
      });
    });
  }
}
