import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import { AppModule } from './app.module';
import { APP_CONFIG } from './common/constants/app.constants';
import { AppLogger } from './common/logger/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new AppLogger();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  const config = new DocumentBuilder()
    .setTitle(APP_CONFIG.SWAGGER.TITLE)
    .setVersion(APP_CONFIG.SWAGGER.VERSION)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(APP_CONFIG.SWAGGER.PATH, app, document);

  const port = process.env.PORT || APP_CONFIG.PORT;
  const server = await app.listen(port);

  const shutdown = async (error: Error, eventName: string) => {
    const isFatal = eventName === 'uncaughtException';
    if (isFatal) {
      logger.fatal(`${eventName}: ${error.message}`, error.stack, 'Process');
    } else {
      logger.error(`${eventName}: ${error.message}`, error.stack, 'Process');
    }

    try {
      server.close();
      await app.close();
    } finally {
      process.exit(1);
    }
  };

  process.on('uncaughtException', (error) =>
    shutdown(error, 'uncaughtException'),
  );

  process.on('unhandledRejection', (reason) =>
    shutdown(
      reason instanceof Error ? reason : new Error(String(reason)),
      'unhandledRejection',
    ),
  );

  logger.log(`Application is running on port ${port}`, 'Bootstrap');
}
bootstrap();
