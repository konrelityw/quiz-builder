import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuizResultDocument = HydratedDocument<QuizResult>;

@Schema({ _id: false })
export class QuizResultAnswer {
  @Prop({ required: true, min: 0 })
  questionDisplayId: number;

  @Prop({ required: true, min: 0 })
  answerDisplayId: number;
}

export const QuizResultAnswerSchema = SchemaFactory.createForClass(QuizResultAnswer);

@Schema({ collection: 'quiz_results', timestamps: true })
export class QuizResult {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId: Types.ObjectId;

  @Prop({ type: [QuizResultAnswerSchema], default: [] })
  selectedAnswers: QuizResultAnswer[];

  @Prop({ required: true, minLength: 1 })
  combinationKey: string;

  @Prop({ required: true, minLength: 1 })
  resultUrl: string;
}

export const QuizResultSchema = SchemaFactory.createForClass(QuizResult);

QuizResultSchema.index({ quizId: 1, createdAt: -1 });
QuizResultSchema.index({ quizId: 1, resultUrl: 1 });
QuizResultSchema.index({
  quizId: 1,
  'selectedAnswers.questionDisplayId': 1,
  'selectedAnswers.answerDisplayId': 1,
});
