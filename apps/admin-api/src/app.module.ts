import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ENV } from './config/config.module.js';
import type { Env } from './config/env.schema.js';
import { BankrollModule } from './modules/bankroll/bankroll.module.js';
import { HealthModule } from './modules/health/health.module.js';

/**
 * Операторские эндпоинты живут отдельным приложением на своём домене:
 * другая аудитория, другие требования к доступу, другой цикл релизов.
 * Смешивать операторские экраны с игровыми — способ однажды показать игроку
 * не то.
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
    HealthModule,
    BankrollModule,
  ],
})
export class AppModule {}
