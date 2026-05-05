import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { API_MESSAGES } from '../../common/constants/api-messages.constants';

@Injectable()
export class GeminiService {
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly baseUrl = process.env.GEMINI_API_BASE_URL;
  private readonly model = process.env.GEMINI_MODEL;

  async generateText(prompt: string): Promise<string> {
    try {
      const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await axios.post(url, {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      });

      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch (error) {
      throw new InternalServerErrorException(API_MESSAGES.AI.GENERATION_FAILED);
    }
  }
}
