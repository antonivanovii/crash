import { sql, type Kysely } from 'kysely';

/**
 * Системные счета для рубля.
 *
 * Валюта добавлена после первого релиза схемы, поэтому отдельной миграцией:
 * править `0002_system_accounts` нельзя — она уже накачена, и на боевой базе
 * ничего бы не изменилось.
 */
const KINDS = ['HOUSE', 'FEE', 'ESCROW', 'SUBSIDY'];

export async function up(db: Kysely<unknown>): Promise<void> {
  for (const kind of KINDS) {
    await sql`
      INSERT INTO accounts (owner_type, owner_id, kind, currency)
      VALUES ('SYSTEM', NULL, ${sql.lit(kind)}, 'RUB')
      ON CONFLICT DO NOTHING
    `.execute(db);
  }
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DELETE FROM accounts WHERE owner_type = 'SYSTEM' AND currency = 'RUB'`.execute(db);
}
