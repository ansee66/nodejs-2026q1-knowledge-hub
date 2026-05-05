import { Injectable } from '@nestjs/common';
import { AiErrorHandler } from './errors/ai-error.handler';
import { withRetry } from '../../common/utils/retry.util';
import { API_MESSAGES } from '../../common/constants/api-messages.constants';

@Injectable()
export class GeminiService {
  constructor(private readonly aiErrorHandler: AiErrorHandler) {}

  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly baseUrl = process.env.GEMINI_API_BASE_URL;
  private readonly model = process.env.GEMINI_MODEL;

  private isRetryable(error: any): boolean {
    const status = error?.status;
    return status === 429 || (status && status >= 500);
  }

  async generateText(prompt: string): Promise<string> {
    try {
      return await withRetry(
        async () => {
          const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
            }),
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw {
              status: response.status,
              data,
              message: data?.error?.message || API_MESSAGES.AI.GEMINI_API_ERROR,
            };
          }

          return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        },
        {
          retries: 3,
          baseDelayMs: 200,
          shouldRetry: (error) => this.isRetryable(error),
        },
      );
    } catch (error) {
      this.aiErrorHandler.handle(error, 'GeminiService');
    }
  }
}
