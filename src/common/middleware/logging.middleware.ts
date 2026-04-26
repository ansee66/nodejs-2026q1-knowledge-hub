import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from '../logger/logger.service';
import { SENSITIVE_FIELDS } from '../constants/app.constants';

const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
  if (!obj || typeof obj !== 'object') return obj;

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      SENSITIVE_FIELDS.includes(key) ? '[REDACTED]' : value,
    ]),
  );
};

const CONTEXT = 'HTTP';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, query, body } = req;
    const startTime = Date.now();

    this.logger.log(
      `→ ${method} ${originalUrl} | query: ${JSON.stringify(query)} | body: ${JSON.stringify(sanitize(body))}`,
      CONTEXT,
    );

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.log(
        `← ${method} ${originalUrl} | status: ${res.statusCode} | ${duration}ms`,
        CONTEXT,
      );
    });

    next();
  }
}
