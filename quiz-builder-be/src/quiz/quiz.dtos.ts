import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuizAnswerDto {
  @IsInt()
  @Min(0)
  displayId: number;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;
}

export class CreateQuizQuestionDto {
  @IsInt()
  @Min(0)
  displayId: number;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsIn(['single', 'multi'])
  type?: 'single' | 'multi';

  @IsOptional()
  @IsBoolean()
  affectsMatching?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizAnswerDto)
  answers: CreateQuizAnswerDto[];
}

export class CreateQuizDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions: CreateQuizQuestionDto[];
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}

export class UpdateCombinationDto {
  @IsString()
  @MinLength(1)
  key: string;

  @IsOptional()
  @IsUrl()
  resultUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  resultType?: string;
}

export class SubmitQuizAnswerDto {
  @IsInt()
  @Min(0)
  questionDisplayId: number;

  @IsInt()
  @Min(0)
  answerDisplayId: number;
}

export class SubmitQuizDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmitQuizAnswerDto)
  selectedAnswers: SubmitQuizAnswerDto[];
}
