import { ChangeDetectorRef, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { QuizStoreService } from '../../../../services/quiz-store.service';
import { QuizBuilderQuestionListComponent } from '../../components/quiz-builder-question-list/quiz-builder-question-list.component';
import { QuizApiService } from '../../../../services/quiz-api.service';
import { Quiz, QuizCombination } from '../../../../shared/entities/Quiz.entity';

@Component({
  selector: 'quiz-builder-page',
  templateUrl: './quiz-builder-page.component.html',
  styleUrl: './quiz-builder-page.component.scss',
  imports: [ReactiveFormsModule, QuizBuilderQuestionListComponent],
})
export class QuizBuilderPage {
  readonly quizStoreService = inject(QuizStoreService);
  private readonly quizApiService = inject(QuizApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  saveStatus = '';
  combinations: QuizCombination[] = [];
  structureStatus = '';
  canBuildMatrix = false;
  isBuildingMatrix = false;
  canShowQuizLink = false;
  hasCombinations = false;

  private setCombinations(combinations: QuizCombination[] | null | undefined) {
    this.combinations = combinations ?? [];
    this.hasCombinations = this.combinations.length > 0;
  }

  private validateQuizBeforeSave(quiz: Quiz): string | null {
    if (!quiz.name?.trim()) {
      return 'Quiz name is required';
    }

    if (!quiz.questions || quiz.questions.length < 2) {
      return 'Quiz must contain at least 2 questions';
    }

    const hasMatchingQuestion = quiz.questions.some((q) => q.affectsMatching !== false);
    if (!hasMatchingQuestion) {
      return 'At least one question must be included in recommendation matching';
    }

    const questionDisplayIds = quiz.questions.map((q) => q.displayId);
    if (new Set(questionDisplayIds).size !== questionDisplayIds.length) {
      return 'Each question must have a unique display ID';
    }

    for (const id of questionDisplayIds) {
      if (!Number.isInteger(id) || id < 0) {
        return 'Each question display ID must be a non-negative integer';
      }
    }

    for (let questionIndex = 0; questionIndex < quiz.questions.length; questionIndex += 1) {
      const question = quiz.questions[questionIndex];

      if (!question.title?.trim()) {
        return `Question ${questionIndex + 1} must have a title`;
      }

      if (!question.answers || question.answers.length < 2) {
        return `Question ${questionIndex + 1} must have at least 2 answers`;
      }

      for (let answerIndex = 0; answerIndex < question.answers.length; answerIndex += 1) {
        const answer = question.answers[answerIndex];

        if (!answer.title?.trim()) {
          return `Answer ${answerIndex + 1} in question ${questionIndex + 1} must have a title`;
        }
      }
    }

    return null;
  }

  private buildCombinations(quizId: string) {
    this.isBuildingMatrix = true;
    this.structureStatus = 'Building combinations...';

    this.quizApiService.saveQuizStructure(quizId).subscribe({
      next: (updatedQuiz) => {
        this.setCombinations(updatedQuiz.combinations);
        this.isBuildingMatrix = false;
        this.structureStatus = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.isBuildingMatrix = false;
        this.structureStatus = 'Failed to generate combinations';
        this.cdr.detectChanges();
      },
    });
  }

  quizForm = this.fb.group({
    quizName: [''],
  });

  private quizNameSignal = toSignal(this.quizForm.controls.quizName.valueChanges, {
    initialValue: '',
  });

  constructor() {
    effect(() => {
      this.quizStoreService.updateQuizName(this.quizNameSignal() ?? '');
    });

    this.route.paramMap.subscribe((params) => {
      const quizId = params.get('id');

      if (!quizId) {
        this.quizStoreService.resetQuiz();
        this.quizForm.patchValue({ quizName: '' });
        this.setCombinations([]);
        this.canBuildMatrix = false;
        this.isBuildingMatrix = false;
        this.canShowQuizLink = false;
        return;
      }

      this.saveStatus = 'Loading quiz...';
      this.quizApiService.getQuizById(quizId).subscribe({
        next: (quiz) => {
          this.quizStoreService.setQuiz(quiz);
          this.setCombinations(quiz.combinations);
          this.canBuildMatrix = Boolean(quiz._id);
          this.isBuildingMatrix = false;
          this.canShowQuizLink = false;
          this.quizForm.patchValue({ quizName: quiz.name });
          this.saveStatus = '';
          this.cdr.detectChanges();
        },
        error: () => {
          this.saveStatus = 'Failed to load quiz';
          this.canBuildMatrix = false;
          this.cdr.detectChanges();
        },
      });
    });
  }

  saveQuizStructure() {
    const quiz = this.quizStoreService.quiz();
    const validationError = this.validateQuizBeforeSave(quiz);
    if (validationError) {
      this.saveStatus = validationError;
      this.cdr.detectChanges();
      return;
    }

    this.saveStatus = 'Saving...';
    const request$ = quiz._id
      ? this.quizApiService.updateQuiz(quiz._id, quiz)
      : this.quizApiService.saveQuiz(quiz);

    request$.subscribe({
      next: (savedQuiz) => {
        this.quizStoreService.setQuiz(savedQuiz);
        this.setCombinations(savedQuiz.combinations ?? this.combinations);
        this.saveStatus = 'Quiz saved successfully';
        this.canBuildMatrix = true;
        this.canShowQuizLink = false;
        if (savedQuiz._id) {
          this.buildCombinations(savedQuiz._id);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.saveStatus = 'Failed to save quiz';
        this.canBuildMatrix = false;
        this.canShowQuizLink = false;
        this.cdr.detectChanges();
      },
    });
  }

  updateCombinationUrl(key: string, value: string) {
    this.combinations = this.combinations.map((combination) =>
      combination.key === key ? { ...combination, resultUrl: value } : combination,
    );
  }

  saveCombinationResults() {
    const quiz = this.quizStoreService.quiz();
    if (!quiz._id) {
      this.structureStatus = 'Save quiz first';
      return;
    }

    if (!this.combinations.length) {
      this.structureStatus = 'Build combinations first';
      this.cdr.detectChanges();
      return;
    }

    const firstInvalidIndex = this.combinations.findIndex(
      (combination) => !combination.resultUrl?.trim(),
    );
    if (firstInvalidIndex !== -1) {
      this.structureStatus = `Fill result URL for combination ${firstInvalidIndex + 1}`;
      this.cdr.detectChanges();
      return;
    }

    this.structureStatus = 'Saving result links...';
    this.quizApiService.saveCombinationResults(quiz._id, this.combinations).subscribe({
      next: (updatedQuiz) => {
        this.setCombinations(updatedQuiz.combinations ?? this.combinations);
        this.structureStatus = 'Result links saved';
        this.canShowQuizLink = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.structureStatus = 'Failed to save result links';
        this.cdr.detectChanges();
      },
    });
  }

  getPublicQuizLink() {
    const quizId = this.quizStoreService.quiz()._id;

    if (!quizId) {
      return '';
    }

    return `${window.location.origin}/quiz/${quizId}`;
  }
}
