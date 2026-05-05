import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { API_MESSAGES } from '../../common/constants/api-messages.constants';
import { isUUID } from 'class-validator';
import { SummarizeArticleDto } from './dto/summarize-article.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('articles/:articleId/summarize')
  @ApiNotFoundResponse({ description: API_MESSAGES.ARTICLE.NOT_FOUND })
  async summarizeArticle(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    if (!isUUID(articleId)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return this.aiService.summarizeArticle(articleId, dto);
  }
}
