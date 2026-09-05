import { createDatabase, type Db, type Tx } from '@kobold/db';
import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.schema.js';

/**
 * Единственная точка доступа к БД.
 *
 * Изоляция — READ COMMITTED с явными FOR UPDATE. SERIALIZABLE заманчив, но даёт
 * ретраи на конфликтах там, где явная блокировка их не даёт.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly db: Db;

  constructor(@Inject(ENV) env: Env) {
    this.db = createDatabase({
      connectionString: env.DATABASE_URL,
      max: env.DATABASE_POOL_MAX,
      applicationName: 'kobold-api',
    });
  }

  /**
   * Денежная транзакция. Все операции с деньгами проходят только здесь —
   * отдельных `db.insertInto('entries')` вне транзакции быть не должно.
   */
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(fn);
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.destroy();
  }
}
