import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ENV } from './config/config.module.js';
import type { Env } from './config/env.schema.js';
import { LeaderModule } from './leader/leader.module.js';
import { PublisherService } from './rounds/publisher.service.js';

/**
 * Оркестратор — отдельное приложение с самого начала, а не «потом вынесем».
 *
 * Он синглтон с leader election: таймер раунда должен тикать ровно в одном
 * месте. Если это не разделено на уровне структуры, разделить потом больно.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      // forRootAsync, а не forRoot: конфиг forRoot вычисляется при импорте
      // модуля — до того, как загружен .env. Через фабрику логгер получает
      // уже провалидированное окружение.
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
        },
      }),
    }),
    LeaderModule,
  ],
  providers: [PublisherService],
})
export class AppModule {}
