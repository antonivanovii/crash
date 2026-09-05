import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { DomainExceptionFilter } from './common/errors/domain-exception.filter.js';
import { IdempotencyModule } from './common/idempotency/idempotency.module.js';
import { BigIntSerializerInterceptor } from './common/serialization/bigint.interceptor.js';
import { ConfigModule, ENV } from './config/config.module.js';
import type { Env } from './config/env.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { FairnessModule } from './modules/fairness/fairness.module.js';
import { DiceModule } from './modules/games/dice/dice.module.js';
import { LimboModule } from './modules/games/limbo/limbo.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { LedgerModule } from './modules/ledger/ledger.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';
import { RiskModule } from './modules/risk/risk.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { RedisModule } from './redis/redis.module.js';

/**
 * Модульный монолит. Домены остаются модулями Nest внутри одного приложения;
 * разрез на процессы идёт по СВОЙСТВУ процесса (api — stateless, orchestrator —
 * синглтон, settler — фоновый), а не по домену. Резать по доменам сейчас —
 * получить распределённые транзакции там, где нужна одна.
 *
 * Порядок сборки бэкенда: ledger + wallet + auth → fairness + games/_shared →
 * первая игра целиком → realtime → orchestrator → risk → sports → markets.
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
          // В каждой записи должны быть ключ идемпотентности и id пользователя —
          // без них разбор инцидента превращается в археологию.
          customProps: (req: { headers: Record<string, unknown>; user?: { id: string } }) => ({
            idempotencyKey: req.headers['idempotency-key'],
            userId: req.user?.id,
          }),
          redact: ['req.headers.cookie', 'req.headers.authorization', 'req.body.password'],
        },
      }),
    }),
    DatabaseModule,
    RedisModule,
    IdempotencyModule,

    LedgerModule,
    WalletModule,
    AuthModule,
    FairnessModule,
    RiskModule,

    HealthModule,
    RealtimeModule,

    LimboModule,
    DiceModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: BigIntSerializerInterceptor },
  ],
})
export class AppModule {}
