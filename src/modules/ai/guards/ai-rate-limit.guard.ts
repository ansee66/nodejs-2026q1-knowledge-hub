import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { API_MESSAGES } from '../../../common/constants/api-messages.constants';

interface RateRecord {
  count: number;
  timestamp: number;
}

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateRecord>();

  private readonly limit = Number(process.env.AI_RATE_LIMIT_RPM ?? 20);
  private readonly windowMs = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const key = request.ip || 'global';
    const now = Date.now();

    const record = this.store.get(key);

    if (!record) {
      this.store.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (now - record.timestamp > this.windowMs) {
      this.store.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= this.limit) {
      const retryAfter = Math.ceil(
        (this.windowMs - (now - record.timestamp)) / 1000,
      );

      response.setHeader('Retry-After', retryAfter);

      throw new HttpException(
        {
          message: API_MESSAGES.AI.TOO_MANY_REQUESTS,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    return true;
  }
}
