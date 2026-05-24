import { Routes } from '@angular/router';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { QuizBuilderPage } from './pages/quiz-builder-page/quiz-builder-page.component';
import { MyQuizzesPageComponent } from './pages/my-quizzes-page/my-quizzes-page.component';
import { QuizAnalyticsPageComponent } from './pages/quiz-analytics-page/quiz-analytics-page.component';

export const quizBuilderRoutes: Routes = [
  {
    path: '',
    component: QuizBuilderPage,
  },
  {
    path: 'my',
    component: MyQuizzesPageComponent,
  },
  {
    path: 'account',
    component: AccountPageComponent,
  },
  {
    path: ':id/analytics',
    component: QuizAnalyticsPageComponent,
  },
  {
    path: ':id',
    component: QuizBuilderPage,
  },
];
