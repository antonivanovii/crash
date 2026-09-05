import { createDatabase, type Db } from '@kobold/db';
import { Global, Module } from '@nestjs/common';
import { loadEnv, type Env } from './env.schema.js';

export const ENV = Symbol('ENV');
export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    { provide: ENV, useFactory: (): Env => loadEnv() },
    {
      provide: DB,
      // Отдельный пул с малым max: операторские отчёты не должны съедать
      // соединения, которые нужны приёму ставок.
      useFactory: (env: Env): Db =>
        createDatabase({
          connectionString: env.DATABASE_URL,
          max: env.DATABASE_POOL_MAX,
          applicationName: 'kobold-admin-api',
        }),
      inject: [ENV],
    },
  ],
  exports: [ENV, DB],
})
export class ConfigModule {}
