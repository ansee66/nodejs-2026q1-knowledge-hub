import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/logger.service';

const CONTEXT = 'ExceptionFilter';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.resolveError(exception);

    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `${request.method} ${request.url} → ${statusCode} ${message}`,
      stack,
      CONTEXT,
    );

    response.status(statusCode).json({ statusCode, error, message });
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && 'message' in res
          ? Array.isArray((res as any).message)
            ? (res as any).message.join(', ')
            : (res as any).message
          : exception.message;

      return {
        statusCode: status,
        message,
        error: exception.name,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
    };
  }
}
