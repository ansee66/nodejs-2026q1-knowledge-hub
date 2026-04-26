import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as fs from 'fs';
import * as path from 'path';

const NEST_TO_WINSTON_LEVEL: Record<string, string> = {
  log: 'info',
  debug: 'debug',
  warn: 'warn',
  error: 'error',
  verbose: 'verbose',
};

const LOG_DIR = 'logs';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    const logLevel = process.env.LOG_LEVEL ?? 'log';
    const maxFileSizeKb = Number(process.env.LOG_MAX_FILE_SIZE ?? 1024);
    const winstonLevel = NEST_TO_WINSTON_LEVEL[logLevel] ?? 'info';

    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: winstonLevel,
      transports: [
        this.buildConsoleTransport(),
        this.buildFileTransport(maxFileSizeKb),
      ],
    });
  }

  private buildConsoleTransport(): winston.transport {
    return new winston.transports.Console({
      format: this.isProduction
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(
              ({ timestamp, level, message, context }) =>
                `[${timestamp}] ${level} ${context ? `[${context}]` : ''} ${message}`,
            ),
          ),
    });
  }

  private buildFileTransport(maxFileSizeKb: number): winston.transport {
    return new (winston.transports as any).DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'app.log',
      maxSize: `${maxFileSizeKb}k`,
      auditFile: path.join(LOG_DIR, 'audit.json'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    });
  }

  private write(level: string, message: string, context?: string): void {
    this.logger.log(level, message, { context });
  }

  log(message: string, context?: string): void {
    this.write('info', message, context);
  }

  debug(message: string, context?: string): void {
    this.write('debug', message, context);
  }

  warn(message: string, context?: string): void {
    this.write('warn', message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.write('error', trace ? `${message}\n${trace}` : message, context);
  }

  verbose(message: string, context?: string): void {
    this.write('verbose', message, context);
  }

  fatal(message: string, trace?: string, context?: string): void {
    this.write(
      'error',
      `FATAL: ${trace ? `${message}\n${trace}` : message}`,
      context,
    );
  }
}
