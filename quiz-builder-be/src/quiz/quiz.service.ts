import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  MailService,
  QuizAnalyticsMailPayload,
} from '../mail/mail.service';
import { User, UserDocument } from '../user/user.schema';
import {
  CreateQuizDto,
  SubmitQuizDto,
  UpdateCombinationDto,
  UpdateQuizDto,
} from './quiz.dtos';
import { QuizResult, QuizResultDocument } from './quiz-result.schema';
import { Quiz, QuizDocument } from './quiz.schema';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
    @InjectModel(QuizResult.name)
    private readonly quizResultModel: Model<QuizResultDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  private questionType(question: Quiz['questions'][number]): 'single' | 'multi' {
    return question.type === 'multi' ? 'multi' : 'single';
  }

  private questionAffectsMatching(question: Quiz['questions'][number]): boolean {
    return question.affectsMatching !== false;
  }

  private matchingQuestions(questions: Quiz['questions']): Quiz['questions'] {
    return questions.filter((q) => this.questionAffectsMatching(q));
  }

  private buildCombinationKey(
    questions: Quiz['questions'],
    items: Quiz['combinations'][number]['answers'],
  ): string {
    const byQuestion = new Map<number, number[]>();
    for (const item of items) {
      const list = byQuestion.get(item.questionDisplayId) ?? [];
      list.push(item.answerDisplayId);
      byQuestion.set(item.questionDisplayId, list);
    }

    return questions
      .map((q) => {
        const ids = byQuestion.get(q.displayId) ?? [];
        const sorted = [...new Set(ids)].sort((a, b) => a - b);
        return `${q.displayId}:${sorted.join(',')}`;
      })
      .join('|');
  }

  private nonEmptySortedSubsets(ids: number[]): number[][] {
    const sortedIds = [...ids].sort((a, b) => a - b);
    const n = sortedIds.length;
    const raw: number[][] = [];
    for (let mask = 1; mask < 1 << n; mask += 1) {
      const subset: number[] = [];
      for (let i = 0; i < n; i += 1) {
        if (mask & (1 << i)) {
          subset.push(sortedIds[i]);
        }
      }
      raw.push(subset);
    }
    raw.sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) {
          return a[i] - b[i];
        }
      }
      return 0;
    });
    return raw;
  }

  private toObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid id format');
    }

    return new Types.ObjectId(value);
  }

  async create(ownerId: string, dto: CreateQuizDto) {
    const { questions, ...rest } = dto;

    return new this.quizModel({
      ownerId: this.toObjectId(ownerId),
      ...rest,
      questions: questions.map((question) => ({
        ...question,
        type: question.type ?? 'single',
        affectsMatching: question.affectsMatching !== false,
      })),
    }).save();
  }

  async findMine(ownerId: string) {
    return this.quizModel.find({ ownerId: this.toObjectId(ownerId) }).exec();
  }

  async findOneMine(ownerId: string, quizId: string) {
    const quiz = await this.quizModel
      .findOne({
        _id: this.toObjectId(quizId),
        ownerId: this.toObjectId(ownerId),
      })
      .exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async findPublic(quizId: string) {
    const quiz = await this.quizModel.findById(this.toObjectId(quizId)).exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async updateMine(ownerId: string, quizId: string, dto: UpdateQuizDto) {
    const patch: Partial<Pick<Quiz, 'name' | 'questions'>> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.questions !== undefined) {
      patch.questions = dto.questions.map((question) => ({
        ...question,
        type: question.type ?? 'single',
        affectsMatching: question.affectsMatching !== false,
      })) as Quiz['questions'];
    }

    const quiz = await this.quizModel
      .findOneAndUpdate(
        {
          _id: this.toObjectId(quizId),
          ownerId: this.toObjectId(ownerId),
        },
        patch,
        { new: true, runValidators: true },
      )
      .exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async buildStructure(ownerId: string, quizId: string) {
    const quiz = await this.findOneMine(ownerId, quizId);
    const matching = this.matchingQuestions(quiz.questions);
    if (!matching.length) {
      throw new BadRequestException('At least one question must affect matching');
    }
    const combinations = this.generateCombinations(matching);
    quiz.combinations = combinations;
    await quiz.save();
    return quiz;
  }

  async updateCombinations(
    ownerId: string,
    quizId: string,
    combinations: UpdateCombinationDto[],
  ) {
    const quiz = await this.findOneMine(ownerId, quizId);
    const updates = new Map(combinations.map((item) => [item.key, item]));

    quiz.combinations = quiz.combinations.map((existing) => {
      const update = updates.get(existing.key);
      if (!update) return existing;

      return {
        ...existing,
        resultUrl: update.resultUrl,
        resultType: update.resultType ?? existing.resultType,
      };
    });

    await quiz.save();
    return quiz;
  }

  async deleteMine(ownerId: string, quizId: string) {
    const result = await this.quizModel
      .findOneAndDelete({
        _id: this.toObjectId(quizId),
        ownerId: this.toObjectId(ownerId),
      })
      .exec();

    if (!result) {
      throw new NotFoundException('Quiz not found');
    }

    return { deleted: true };
  }

  async submitPublic(quizId: string, dto: SubmitQuizDto) {
    const quiz = await this.findPublic(quizId);
    const questions = quiz.questions ?? [];
    const byQuestion = new Map<number, number[]>();

    for (const row of dto.selectedAnswers) {
      const list = byQuestion.get(row.questionDisplayId) ?? [];
      list.push(row.answerDisplayId);
      byQuestion.set(row.questionDisplayId, list);
    }

    if (byQuestion.size !== questions.length) {
      throw new BadRequestException('Please answer all questions');
    }

    for (const question of questions) {
      const rawSelected = byQuestion.get(question.displayId);
      if (!rawSelected?.length) {
        throw new BadRequestException('Please answer all questions');
      }

      const uniqueSorted = [...new Set(rawSelected)].sort((a, b) => a - b);
      if (this.questionType(question) === 'single' && uniqueSorted.length !== 1) {
        throw new BadRequestException('Single-select question must have exactly one answer');
      }

      for (const answerId of uniqueSorted) {
        const hasAnswer = question.answers.some((answer) => answer.displayId === answerId);
        if (!hasAnswer) {
          throw new BadRequestException('Invalid answer set');
        }
      }

      byQuestion.set(question.displayId, uniqueSorted);
    }

    const flatSelected: { questionDisplayId: number; answerDisplayId: number }[] = [];
    for (const question of questions) {
      for (const answerDisplayId of byQuestion.get(question.displayId) ?? []) {
        flatSelected.push({ questionDisplayId: question.displayId, answerDisplayId });
      }
    }

    const matchingQuestions = this.matchingQuestions(questions);
    if (!matchingQuestions.length) {
      throw new BadRequestException('Quiz has no matching questions configured');
    }

    type CombinationAnswer = Quiz['combinations'][number]['answers'][number];
    const keyAnswerItems: CombinationAnswer[] = [];
    for (const question of matchingQuestions) {
      for (const answerDisplayId of byQuestion.get(question.displayId) ?? []) {
        const answer = question.answers.find((a) => a.displayId === answerDisplayId);
        keyAnswerItems.push({
          questionDisplayId: question.displayId,
          answerDisplayId,
          questionTitle: question.title,
          answerTitle: answer?.title ?? '',
        });
      }
    }

    const combinationKey = this.buildCombinationKey(matchingQuestions, keyAnswerItems);

    const matchedCombination = (quiz.combinations ?? []).find(
      (combination) => combination.key === combinationKey,
    );
    const resultUrl = matchedCombination?.resultUrl?.trim();

    if (!resultUrl) {
      throw new NotFoundException('No result configured for this answer set');
    }

    await this.quizResultModel.create({
      quizId: quiz._id,
      selectedAnswers: flatSelected,
      combinationKey,
      resultUrl,
    });

    return { resultUrl };
  }

  async getQuizAnalytics(
    ownerId: string,
    quizId: string,
    options?: { from?: Date; to?: Date },
  ) {
    const quiz = await this.findOneMine(ownerId, quizId);
    const quizObjectId = this.toObjectId(quizId);

    const match: Record<string, unknown> = { quizId: quizObjectId };
    if (options?.from != null || options?.to != null) {
      const createdAt: Record<string, Date> = {};
      if (options.from != null) {
        createdAt.$gte = options.from;
      }
      if (options.to != null) {
        createdAt.$lte = options.to;
      }
      match.createdAt = createdAt;
    }

    const [totalSubmissions, resultCounts, answerCounts] = await Promise.all([
      this.quizResultModel.countDocuments(match),
      this.quizResultModel.aggregate<{
        _id: string;
        count: number;
      }>([
        { $match: match },
        { $group: { _id: '$resultUrl', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.quizResultModel.aggregate<{
        _id: { questionDisplayId: number; answerDisplayId: number };
        count: number;
      }>([
        { $match: match },
        { $unwind: '$selectedAnswers' },
        {
          $group: {
            _id: {
              questionDisplayId: '$selectedAnswers.questionDisplayId',
              answerDisplayId: '$selectedAnswers.answerDisplayId',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const questionTitleMap = new Map(quiz.questions.map((question) => [question.displayId, question.title]));
    const answerTitleMap = new Map(
      quiz.questions.flatMap((question) =>
        question.answers.map((answer) => [
          `${question.displayId}:${answer.displayId}`,
          answer.title,
        ]),
      ),
    );

    return {
      quizId: quiz._id.toString(),
      quizName: quiz.name,
      totalSubmissions,
      resultStats: resultCounts.map((result) => ({
        resultUrl: result._id,
        count: result.count,
      })),
      answerStats: answerCounts.map((answer) => ({
        questionDisplayId: answer._id.questionDisplayId,
        questionTitle: questionTitleMap.get(answer._id.questionDisplayId) ?? 'Unknown question',
        answerDisplayId: answer._id.answerDisplayId,
        answerTitle:
          answerTitleMap.get(`${answer._id.questionDisplayId}:${answer._id.answerDisplayId}`) ??
          'Unknown answer',
        count: answer.count,
      })),
    };
  }

  async emailQuizAnalytics(ownerId: string, quizId: string) {
    const owner = await this.userModel.findById(this.toObjectId(ownerId)).exec();
    if (!owner?.email?.trim()) {
      throw new BadRequestException('Add an email address in your account (register with email).');
    }
    if (!owner.emailVerified) {
      throw new BadRequestException('A verified email address is required.');
    }

    const now = new Date();
    const periodFrom = owner.analyticsDigestLastSentAt ?? new Date(0);
    const overall = await this.getQuizAnalytics(ownerId, quizId);
    const period = await this.getQuizAnalytics(ownerId, quizId, { from: periodFrom, to: now });

    const overallPayload = this.toQuizAnalyticsMailPayload(overall);
    const periodPayload = this.toQuizAnalyticsMailPayload(period);
    const periodCaption = owner.analyticsDigestLastSentAt
      ? this.mailService.formatDigestPeriodCaption(periodFrom, now)
      : 'All submissions stored in the system (no previous digest email on file yet).';

    await this.mailService.sendQuizAnalyticsEmail(
      owner.email,
      overallPayload,
      periodPayload,
      periodCaption,
    );
    return { sent: true };
  }

  async buildWeeklyDigestSectionsForUser(
    ownerId: string,
    periodFrom: Date,
    periodTo: Date,
    periodCaption: string,
  ): Promise<string[]> {
    const quizzes = await this.findMine(ownerId);
    const sections: string[] = [];

    for (const quiz of quizzes) {
      const overall = await this.getQuizAnalytics(ownerId, quiz._id.toString());
      const period = await this.getQuizAnalytics(ownerId, quiz._id.toString(), {
        from: periodFrom,
        to: periodTo,
      });
      const overallPayload = this.toQuizAnalyticsMailPayload(overall);
      const periodPayload = this.toQuizAnalyticsMailPayload(period);
      sections.push(
        this.mailService.formatDigestQuizSection(overallPayload, periodPayload, periodCaption),
      );
    }

    return sections;
  }

  private toQuizAnalyticsMailPayload(analytics: {
    quizName: string;
    totalSubmissions: number;
    resultStats: { resultUrl: string; count: number }[];
    answerStats: {
      questionTitle: string;
      answerTitle: string;
      count: number;
    }[];
  }): QuizAnalyticsMailPayload {
    return {
      quizName: analytics.quizName,
      totalSubmissions: analytics.totalSubmissions,
      resultStats: analytics.resultStats,
      answerStats: analytics.answerStats.map((row) => ({
        questionTitle: row.questionTitle,
        answerTitle: row.answerTitle,
        count: row.count,
      })),
    };
  }

  private generateCombinations(questions: Quiz['questions']) {
    if (!questions.length || questions.some((question) => !question.answers.length)) {
      return [];
    }

    type CombinationItem = Quiz['combinations'][number]['answers'][number];

    const build = (
      questionIndex: number,
      current: CombinationItem[],
    ): Quiz['combinations'] => {
      if (questionIndex >= questions.length) {
        const key = this.buildCombinationKey(questions, current);

        return [
          {
            key,
            answers: current,
            resultType: 'product',
            resultUrl: '',
          },
        ];
      }

      const question = questions[questionIndex];
      const result: Quiz['combinations'] = [];

      if (this.questionType(question) === 'multi') {
        const subsets = this.nonEmptySortedSubsets(question.answers.map((a) => a.displayId));
        for (const subset of subsets) {
          const additions: CombinationItem[] = subset.map((answerDisplayId) => {
            const answer = question.answers.find((a) => a.displayId === answerDisplayId)!;
            return {
              questionDisplayId: question.displayId,
              answerDisplayId,
              questionTitle: question.title,
              answerTitle: answer.title,
            };
          });
          result.push(...build(questionIndex + 1, [...current, ...additions]));
        }
      } else {
        for (const answer of question.answers) {
          result.push(
            ...build(questionIndex + 1, [
              ...current,
              {
                questionDisplayId: question.displayId,
                answerDisplayId: answer.displayId,
                questionTitle: question.title,
                answerTitle: answer.title,
              },
            ]),
          );
        }
      }

      return result;
    };

    return build(0, []);
  }
}
