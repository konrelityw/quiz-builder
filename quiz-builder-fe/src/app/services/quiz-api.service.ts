import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  Quiz,
  QuizAnalytics,
  QuizCombination,
  QuizSubmitAnswer,
  QuizSubmitResponse,
} from '../shared/entities/Quiz.entity';

@Injectable({providedIn: 'root'})
export class QuizApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  saveQuiz(quiz: Quiz) {
    const payload = {
      name: quiz.name,
      questions: quiz.questions,
    };

    return this.http.post<Quiz>(`${this.apiUrl}/quiz`, payload);
  }

  getMyQuizzes() {
    return this.http.get<Quiz[]>(`${this.apiUrl}/quiz/my`);
  }

  getQuizById(quizId: string) {
    return this.http.get<Quiz>(`${this.apiUrl}/quiz/${quizId}`);
  }

  getPublicQuizById(quizId: string) {
    return this.http.get<Quiz>(`${this.apiUrl}/quiz/public/${quizId}`);
  }

  submitPublicQuiz(quizId: string, selectedAnswers: QuizSubmitAnswer[]) {
    return this.http.post<QuizSubmitResponse>(`${this.apiUrl}/quiz/public/${quizId}/submit`, {
      selectedAnswers,
    });
  }

  updateQuiz(quizId: string, quiz: Quiz) {
    const payload = {
      name: quiz.name,
      questions: quiz.questions,
    };

    return this.http.patch<Quiz>(`${this.apiUrl}/quiz/${quizId}`, payload);
  }

  deleteQuiz(quizId: string) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/quiz/${quizId}`);
  }

  saveQuizStructure(quizId: string) {
    return this.http.post<Quiz>(`${this.apiUrl}/quiz/${quizId}/structure`, {});
  }

  saveCombinationResults(quizId: string, combinations: QuizCombination[]) {
    const payload = combinations.map((item) => ({
      key: item.key,
      resultUrl: item.resultUrl ?? '',
      resultType: item.resultType ?? 'product',
    }));

    return this.http.patch<Quiz>(`${this.apiUrl}/quiz/${quizId}/combinations`, payload);
  }

  getQuizAnalytics(quizId: string) {
    return this.http.get<QuizAnalytics>(`${this.apiUrl}/quiz/${quizId}/analytics`);
  }

  emailQuizAnalytics(quizId: string) {
    return this.http.post<{ sent: boolean }>(`${this.apiUrl}/quiz/${quizId}/analytics/email`, {});
  }
}
