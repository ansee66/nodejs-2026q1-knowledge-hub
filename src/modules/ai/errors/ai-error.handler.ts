import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppLogger } from '../../../common/logger/logger.service';
import { API_MESSAGES } from '../../../common/constants/api-messages.constants';

@Injectable()
export class AiErrorHandler {
  constructor(private readonly logger: AppLogger) {}

  handle(error: unknown, context = 'AI'): never {
    if ((error as any)?.status) {
      const status = (error as any).status;
      const data = (error as any).data;

      this.logger.error(
        `AI API error: status=${status}, message=${error['message']}`,
        undefined,
        context,
      );

      if (status === 429) {
        throw new ServiceUnavailableException({
          message: API_MESSAGES.AI.RATE_LIMIT,
          details: API_MESSAGES.COMMON.RETRY_LATER,
        });
      }

      if (status === 401 || status === 403) {
        throw new InternalServerErrorException({
          message: API_MESSAGES.AI.AUTH_FAILED,
          details: API_MESSAGES.COMMON.INVALID_API_KEY,
        });
      }

      if (status && status >= 500) {
        throw new ServiceUnavailableException({
          message: API_MESSAGES.AI.SERVICE_UNAVAILABLE,
          details: API_MESSAGES.COMMON.SERVICE_ERROR,
        });
      }

      throw new InternalServerErrorException({
        message: API_MESSAGES.AI.GENERATION_FAILED,
        details: data?.error?.message || error['message'],
      });
    }

    if (error instanceof Error) {
      this.logger.error(error.message, error.stack, context);

      throw new ServiceUnavailableException({
        message: API_MESSAGES.AI.SERVICE_UNAVAILABLE,
        details: API_MESSAGES.COMMON.NETWORK_ERROR,
      });
    }

    throw new InternalServerErrorException(API_MESSAGES.AI.UNKNOWN_ERROR);
  }
}
