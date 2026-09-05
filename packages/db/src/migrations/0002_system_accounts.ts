import { sql, type Kysely } from 'kysely';

/**
 * Системные счета по одной на валюту.
 *
 * Четыре суммы, которые нельзя путать (см. дашборд банкролла): свободный
 * банкролл, эскроу игр, обязательства спорта, резерв под субсидии LMSR.
 * Каждая живёт на своём счёте, а не выводится вычитанием.
 */

const CURRENCIES = ['USD', 'EUR', 'BTC', 'ETH', 'USDT'];
const KINDS = ['HOUSE', 'FEE', 'ESCROW', 'SUBSIDY'];

export async function up(db: Kysely<unknown>): Promise<void> {
  for (const currency of CURRENCIES) {
    for (const kind of KINDS) {
      await sql`
        INSERT INTO accounts (owner_type, owner_id, kind, currency)
        VALUES ('SYSTEM', NULL, ${sql.lit(kind)}, ${sql.lit(currency)})
        ON CONFLICT DO NOTHING
      `.execute(db);
    }
  }
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DELETE FROM accounts WHERE owner_type = 'SYSTEM'`.execute(db);
}
