export interface Quiz {
  _id: string;
  name: string;
  questions: Question[];
  combinations?: QuizCombination[];
}

export type QuestionType = 'single' | 'multi';

export interface Question {
  displayId: number;
  title: string;
  subtitle?: string;
  type?: QuestionType;
  affectsMatching?: boolean;
  answers: Answer[];
}

export interface Answer {
  displayId: number;
  title: string;
  subtitle?: string;
}

export interface QuizCombinationAnswer {
  questionDisplayId: number;
  answerDisplayId: number;
  questionTitle: string;
  answerTitle: string;
}

export interface QuizCombination {
  key: string;
  answers: QuizCombinationAnswer[];
  resultUrl?: string;
  resultType?: string;
}

export interface QuizSubmitAnswer {
  questionDisplayId: number;
  answerDisplayId: number;
}

export interface QuizSubmitResponse {
  resultUrl: string;
}

export interface QuizResultStat {
  resultUrl: string;
  count: number;
}

export interface QuizAnswerStat {
  questionDisplayId: number;
  questionTitle: string;
  answerDisplayId: number;
  answerTitle: string;
  count: number;
}

export interface QuizAnalytics {
  quizId: string;
  quizName: string;
  totalSubmissions: number;
  resultStats: QuizResultStat[];
  answerStats: QuizAnswerStat[];
}
