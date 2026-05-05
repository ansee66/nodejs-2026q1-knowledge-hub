import { Injectable } from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { GeminiService } from './gemini.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { SummarizeArticleResponse } from './types/summarize-response.interface';

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
}
