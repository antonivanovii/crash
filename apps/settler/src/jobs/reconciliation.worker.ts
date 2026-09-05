import { createDatabase, sql, type Db } from '@kobold/db';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.schema.js';
import { QUEUES, type ReconciliationJob } from './queues.js';

/**
 * Ночная сверка леджера.
 *
 * Денормализованный баланс кошелька обязан совпадать с суммой проводок по его
 * счёту. Расхождение — инцидент: значит, где-то баланс обновили мимо леджера.
 * Молча «починить» кошелёк по факту нельзя, потому что тогда исчезнет и след
 * ошибки, и деньги.
 */
@Injectable()
export class ReconciliationWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(ReconciliationWorker.name);
  private readonly db: Db;
  private readonly connection: Redis;
  private worker?: Worker<ReconciliationJob>;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.db = createDatabase({
      connectionString: env.DATABASE_URL,
      max: env.DATABASE_POOL_MAX,
      applicationName: 'kobold-settler',
    });
    this.connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }

  onModuleInit(): void {
    this.worker = new Worker<ReconciliationJob>(
      QUEUES.ledgerReconciliation,
      async (job) => this.reconcile(job.data),
      { connection: this.connection, concurrency: 1 },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error({ err: error, jobId: job?.id }, 'Сверка упала');
    });
  }

  async reconcile(_job: ReconciliationJob): Promise<{ mismatches: number }> {
    const rows = await sql<{
      user_id: string;
      currency: string;
      wallet_balance: string;
      ledger_balance: string;
    }>`
      SELECT w.user_id,
             w.currency,
             w.balance            AS wallet_balance,
             COALESCE(SUM(e.amount), 0) AS ledger_balance
        FROM wallets w
        JOIN accounts a ON a.id = w.account_id
        LEFT JOIN entries e ON e.account_id = a.id
       GROUP BY w.user_id, w.currency, w.balance
      HAVING w.balance <> COALESCE(SUM(e.amount), 0)
    `.execute(this.db);

    for (const row of rows.rows) {
      this.logger.error(
        {
          userId: row.user_id,
          currency: row.currency,
          walletBalance: row.wallet_balance,
          ledgerBalance: row.ledger_balance,
        },
        'Баланс кошелька разошёлся с леджером',
      );
    }

    return { mismatches: rows.rows.length };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
    await this.connection.quit();
    await this.db.destroy();
  }
}
