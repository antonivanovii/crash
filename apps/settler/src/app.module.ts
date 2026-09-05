import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ENV } from './config/config.module.js';
import type { Env } from './config/env.schema.js';
import { ReconciliationWorker } from './jobs/reconciliation.worker.js';

/**
 * Settler — фоновый воркер: переживает падения, ретраит, может доедать работу
 * частями. Отдельное приложение именно поэтому, а не потому, что «расчёт — это
 * отдельный домен».
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
  ],
  providers: [ReconciliationWorker],
})
export class AppModule {}
