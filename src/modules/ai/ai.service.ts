import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { GeminiService } from './gemini.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { SummarizeArticleResponse } from './types/summarize-response.interface';
import { buildTranslatePrompt } from './prompts/translate.prompt';
import { TranslateArticleResponse } from './types/translate-response.interface';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import {
  AnalyzeAIResponse,
  AnalyzeArticleResponse,
} from './types/analyze-response.interface';
import { buildAnalyzePrompt } from './prompts/analyze.prompt';
import { API_MESSAGES } from '../../common/constants/api-messages.constants';
import { extractJson } from '../../common/utils/json.util';

@Injectable()
export class AiService {
  constructor(
    private readonly articleService: ArticleService,
    private readonly geminiService: GeminiService,
  ) {}

  async summarizeArticle(
    articleId: string,
    dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponse> {
    const article = await this.articleService.findById(articleId);

    const text = article.content;

    const prompt = buildSummarizePrompt(text, dto.maxLength);

    const summary = await this.geminiService.generateText(prompt);

    return {
      articleId,
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
    };
  }

  async translateArticle(
    articleId: string,
    dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponse> {
    const article = await this.articleService.findById(articleId);

    const prompt = buildTranslatePrompt(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );

    const translatedText = await this.geminiService.generateText(prompt);

    return {
      articleId: articleId,
      translatedText,
      detectedLanguage: dto.sourceLanguage ?? 'auto',
    };
  }

  async analyzeArticle(
    articleId: string,
    dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponse> {
    const article = await this.articleService.findById(articleId);

    const prompt = buildAnalyzePrompt(article.content, dto.task);

    const result = await this.geminiService.generateText(prompt);

    let parsed: AnalyzeAIResponse;

    try {
      parsed = JSON.parse(extractJson(result));
    } catch {
      throw new InternalServerErrorException(
        API_MESSAGES.AI.INVALID_AI_RESPONSE_FORMAT,
      );
    }

    if (
      !(
        typeof parsed?.analysis === 'string' &&
        Array.isArray(parsed?.suggestions) &&
        ['info', 'warning', 'error'].includes(parsed?.severity)
      )
    ) {
      throw new InternalServerErrorException(
        API_MESSAGES.AI.INVALID_AI_RESPONSE_FORMAT,
      );
    }

    return {
      articleId: articleId,
      analysis: parsed.analysis,
      suggestions: parsed.suggestions,
      severity: parsed.severity,
    };
  }

  async generate(prompt: string) {
    return await this.geminiService.generateText(prompt);
  }
}
