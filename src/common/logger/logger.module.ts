import { Module, Global } from '@nestjs/common';
import { AppLogger } from './logger.service';

@Global() // чтобы не импортировать в каждый модуль
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
