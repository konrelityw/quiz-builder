import {Injectable, signal} from '@angular/core';
import {Answer, Question, Quiz} from '../shared/entities/Quiz.entity';

@Injectable({providedIn: 'root'})
export class QuizStoreService {
  private readonly emptyQuiz: Quiz = {
    _id: '',
    name: '',
    questions: [],
  };

  readonly quiz = signal<Quiz>({
    _id: '',
    name: '',
    questions: [],
  });

  setQuiz(quiz: Quiz) {
    this.quiz.set(quiz);
  }

  resetQuiz() {
    this.quiz.set({...this.emptyQuiz, questions: []});
  }

  updateQuizName(name: string) {
    this.quiz.update((q) => ({...q, name}));
  }

  addQuestion(question: Omit<Question, 'displayId'>) {
    this.quiz.update((q) => {
      const nextDisplayId =
        q.questions.length === 0
          ? 0
          : Math.max(...q.questions.map((x) => x.displayId)) + 1;

      return {
        ...q,
        questions: [
          ...q.questions,
          {
            ...question,
            type: question.type ?? 'single',
            affectsMatching: question.affectsMatching !== false,
            displayId: nextDisplayId,
          },
        ],
      };
    });
  }

  moveQuestion(fromIndex: number, toIndex: number) {
    this.quiz.update((q) => {
      const {questions} = q;
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= questions.length ||
        toIndex >= questions.length ||
        fromIndex === toIndex
      ) {
        return q;
      }

      const next = [...questions];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);

      return {...q, questions: next};
    });
  }

  updateQuestion(displayId: number, changes: Partial<Question>) {
    this.quiz.update((q) => ({
      ...q,
      questions: q.questions.map((question) =>
        question.displayId === displayId ? {...question, ...changes} : question,
      ),
    }));
  }

  removeQuestion(displayId: number) {
    this.quiz.update((q) => ({
      ...q,
      questions: q.questions.filter((q) => q.displayId !== displayId),
    }));
  }

  getAnswers(questionDisplayId: number) {
    return this.quiz().questions.find((q) => q.displayId === questionDisplayId)?.answers ?? [];
  }

  getQuestion(questionDisplayId: number) {
    return this.quiz().questions.find((q) => q.displayId === questionDisplayId);
  }

  getAnswer(questionDisplayId: number, answerDisplayId: number) {
    return this.getAnswers(questionDisplayId).find((a) => a.displayId === answerDisplayId);
  }

  addAnswer(questionDisplayId: number, answer: Omit<Answer, 'displayId'>) {
    this.quiz.update((q) => ({
      ...q,
      questions: q.questions.map((question) =>
        question.displayId === questionDisplayId
          ? {
            ...question,
            answers: [...question.answers, {...answer, displayId: question.answers.length}],
          }
          : question,
      ),
    }));
  }

  updateAnswer(questionDisplayId: number, answerDisplayId: number, changes: Partial<Answer>) {
    this.quiz.update((q) => ({
      ...q,
      questions: q.questions.map((question) =>
        question.displayId === questionDisplayId
          ? {
            ...question,
            answers: question.answers.map((answer) =>
              answer.displayId === answerDisplayId ? {...answer, ...changes} : answer,
            ),
          }
          : question,
      ),
    }));
  }

  removeAnswer(questionDisplayId: number, answerDisplayId: number) {
    this.quiz.update((q) => ({
      ...q,
      questions: q.questions.map((question) =>
        question.displayId === questionDisplayId
          ? {
            ...question,
            answers: question.answers.filter((a) => a.displayId !== answerDisplayId),
          }
          : question,
      ),
    }));
  }
}
