import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { ArticleModule } from '../article/article.module';
import { AiErrorHandler } from './errors/ai-error.handler';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [AiService, GeminiService, AiErrorHandler],
  exports: [AiService],
})
export class AiModule {}
