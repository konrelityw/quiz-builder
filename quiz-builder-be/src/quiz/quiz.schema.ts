import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuizDocument = HydratedDocument<Quiz>;

@Schema({ _id: false })
export class QuizAnswer {
  @Prop({ required: true, min: 0 })
  displayId: number;

  @Prop({ required: true, minLength: 1 })
  title: string;

  @Prop()
  subtitle?: string;
}

export const QuizAnswerSchema = SchemaFactory.createForClass(QuizAnswer);

@Schema({ _id: false })
export class QuizQuestion {
  @Prop({ required: true, min: 0 })
  displayId: number;

  @Prop({ required: true, minLength: 1 })
  title: string;

  @Prop()
  subtitle?: string;

  @Prop({ type: String, enum: ['single', 'multi'], default: 'single' })
  type: 'single' | 'multi';

  @Prop({ default: true })
  affectsMatching: boolean;

  @Prop({ type: [QuizAnswerSchema], default: [] })
  answers: QuizAnswer[];
}

export const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

@Schema({ _id: false })
export class QuizCombinationAnswer {
  @Prop({ required: true, min: 0 })
  questionDisplayId: number;

  @Prop({ required: true, min: 0 })
  answerDisplayId: number;

  @Prop({ required: true, minLength: 1 })
  questionTitle: string;

  @Prop({ required: true, minLength: 1 })
  answerTitle: string;
}

export const QuizCombinationAnswerSchema =
  SchemaFactory.createForClass(QuizCombinationAnswer);

@Schema({ _id: false })
export class QuizCombination {
  @Prop({ required: true, minLength: 1 })
  key: string;

  @Prop({ type: [QuizCombinationAnswerSchema], default: [] })
  answers: QuizCombinationAnswer[];

  @Prop()
  resultUrl?: string;

  @Prop({ default: 'product' })
  resultType?: string;
}

export const QuizCombinationSchema = SchemaFactory.createForClass(QuizCombination);

@Schema({ collection: 'quiz', timestamps: true })
export class Quiz {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, minLength: 1 })
  name: string;

  @Prop({ type: [QuizQuestionSchema], default: [] })
  questions: QuizQuestion[];

  @Prop({ type: [QuizCombinationSchema], default: [] })
  combinations: QuizCombination[];
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
