import { sql, type Db } from '@kobold/db';
import { Controller, Get, Inject } from '@nestjs/common';
import { DB } from '../../config/config.module.js';

/**
 * Дашборд банкролла.
 *
 * Четыре разные суммы, и путать их нельзя:
 *   — свободный банкролл (счета HOUSE);
 *   — в эскроу игр (открытые раунды);
 *   — под обязательствами спорта (принятые, но не рассчитанные ставки);
 *   — зарезервированное под субсидии LMSR.
 *
 * «Сколько у нас денег» — вопрос без ответа, пока не сказано, какая из четырёх.
 */
@Controller('bankroll')
export class BankrollController {
  constructor(@Inject(DB) private readonly db: Db) {}

  @Get()
  async summary() {
    const balances = await sql<{ kind: string; currency: string; balance: string }>`
      SELECT a.kind,
             a.currency,
             COALESCE(SUM(e.amount), 0)::text AS balance
        FROM accounts a
        LEFT JOIN entries e ON e.account_id = a.id
       WHERE a.owner_type = 'SYSTEM'
       GROUP BY a.kind, a.currency
       ORDER BY a.currency, a.kind
    `.execute(this.db);

    const escrow = await sql<{ currency: string; amount: string }>`
      SELECT currency, COALESCE(SUM(stake), 0)::text AS amount
        FROM rounds
       WHERE status = 'ACTIVE'
       GROUP BY currency
    `.execute(this.db);

    return {
      systemAccounts: balances.rows,
      gameEscrow: escrow.rows,
      sportsLiability: [],
      lmsrSubsidy: [],
    };
  }
}
