import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { API_MESSAGES } from '../../common/constants/api-messages.constants';
import { isUUID } from 'class-validator';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';

@UseGuards(AiRateLimitGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('articles/:articleId/summarize')
  @HttpCode(200)
  @ApiNotFoundResponse({ description: API_MESSAGES.ARTICLE.NOT_FOUND })
  async summarizeArticle(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    if (!isUUID(articleId)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return await this.aiService.summarizeArticle(articleId, dto);
  }

  @Post('articles/:articleId/translate')
  @HttpCode(200)
  @ApiNotFoundResponse({ description: API_MESSAGES.ARTICLE.NOT_FOUND })
  async translateArticle(
    @Param('articleId') articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    if (!isUUID(articleId)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return await this.aiService.translateArticle(articleId, dto);
  }

  @Post('articles/:articleId/analyze')
  @HttpCode(200)
  @ApiNotFoundResponse({ description: API_MESSAGES.ARTICLE.NOT_FOUND })
  async analyzeArticle(
    @Param('articleId') articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ) {
    if (!isUUID(articleId)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return await this.aiService.analyzeArticle(articleId, dto);
  }

  @Post('generate')
  @HttpCode(200)
  async generate(@Body() dto: GenerateDto) {
    return await this.aiService.generate(dto.prompt);
  }
}
