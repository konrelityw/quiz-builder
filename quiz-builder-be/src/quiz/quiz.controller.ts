import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { EmailVerifiedGuard } from '../common/guards/email-verified.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateQuizDto,
  SubmitQuizDto,
  UpdateCombinationDto,
  UpdateQuizDto,
} from './quiz.dtos';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  create(@Request() req, @Body() dto: CreateQuizDto) {
    return this.quizService.create(req.user._id.toString(), dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  findMine(@Request() req) {
    return this.quizService.findMine(req.user._id.toString());
  }

  @Get('public/:id')
  findPublic(@Param('id') id: string) {
    return this.quizService.findPublic(id);
  }

  @Post('public/:id/submit')
  submitPublic(@Param('id') id: string, @Body() dto: SubmitQuizDto) {
    return this.quizService.submitPublic(id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  findOneMine(@Request() req, @Param('id') id: string) {
    return this.quizService.findOneMine(req.user._id.toString(), id);
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  getQuizAnalytics(@Request() req, @Param('id') id: string) {
    return this.quizService.getQuizAnalytics(req.user._id.toString(), id);
  }

  @Post(':id/analytics/email')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  emailQuizAnalytics(@Request() req, @Param('id') id: string) {
    return this.quizService.emailQuizAnalytics(req.user._id.toString(), id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  updateMine(@Request() req, @Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizService.updateMine(req.user._id.toString(), id, dto);
  }

  @Post(':id/structure')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  buildStructure(@Request() req, @Param('id') id: string) {
    return this.quizService.buildStructure(req.user._id.toString(), id);
  }

  @Patch(':id/combinations')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  updateCombinations(
    @Request() req,
    @Param('id') id: string,
    @Body() combinations: UpdateCombinationDto[],
  ) {
    return this.quizService.updateCombinations(req.user._id.toString(), id, combinations);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  deleteMine(@Request() req, @Param('id') id: string) {
    return this.quizService.deleteMine(req.user._id.toString(), id);
  }
}
