import {Routes} from '@angular/router';
import {authGuard} from './guards/auth.guard';
import {PublicQuizPageComponent} from './features/public-quiz/pages/public-quiz-page/public-quiz-page.component';
import {ProductPageComponent} from './features/example-pages/products/product-page.component';
import {StoreHomeComponent} from './features/example-pages/store-home-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'quiz-builder',
  },
  {
    path: 'products/:id',
    component: ProductPageComponent
  },
  {
    path: 'home',
    component: StoreHomeComponent,
  },
  {
    path: 'quiz/:id',
    component: PublicQuizPageComponent,
  },
  {
    path: '',
    loadChildren: () => import('./features/auth').then((m) => m.authRoutes),
  },
  {
    path: 'quiz-builder',
    canActivate: [authGuard],
    loadChildren: () => import('./features/quiz-builder').then((m) => m.quizBuilderRoutes),
  },
];
