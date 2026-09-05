import { Kysely, PostgresDialect, sql, type Transaction } from 'kysely';
import pg from 'pg';
import type { Database } from './schema.js';

export type Db = Kysely<Database>;
export type Tx = Transaction<Database>;
/** Любой исполнитель запроса: пул или транзакция. Репозитории принимают именно его. */
export type Executor = Db | Tx;

/**
 * Драйвер настраивается ДО первого соединения.
 *
 * NUMERIC приходит строкой по умолчанию — и это правильно, потому что как number
 * он бы тихо потерял точность. Все NUMERIC в этой схеме — целые минорные единицы,
 * поэтому парсим их сразу в BigInt: ни одна сумма не окажется числом с плавающей
 * точкой даже случайно.
 *
 * int8 намеренно остаётся строкой: count(*) не деньги, а BigInt в счётчиках
 * ломает арифметику в неожиданных местах.
 */
let parsersInstalled = false;

export function installTypeParsers(): void {
  if (parsersInstalled) return;
  pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value: string) => BigInt(value));
  parsersInstalled = true;
}

export interface DatabaseConfig {
  readonly connectionString: string;
  readonly max?: number;
  readonly applicationName?: string;
  readonly statementTimeoutMs?: number;
  readonly log?: (event: { sql: string; durationMs: number; error?: unknown }) => void;
}

export function createPool(config: DatabaseConfig): pg.Pool {
  installTypeParsers();
  return new pg.Pool({
    connectionString: config.connectionString,
    max: config.max ?? 20,
    application_name: config.applicationName ?? 'kobold',
    // Запрос, висящий дольше 15 секунд, держит блокировку кошелька. Лучше упасть.
    statement_timeout: config.statementTimeoutMs ?? 15_000,
  });
}

export function createDatabase(config: DatabaseConfig, pool = createPool(config)): Db {
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log: config.log
      ? (event) => {
          config.log?.({
            sql: event.query.sql,
            durationMs: event.queryDurationMillis,
            error: event.level === 'error' ? event.error : undefined,
          });
        }
      : undefined,
  });
}

/**
 * Блокировка строки кошелька. Порядок блокировок во всём проекте один:
 * СНАЧАЛА кошелёк, потом раунд или исход. Разный порядок в разных местах даёт
 * дедлоки, которые воспроизводятся раз в неделю.
 */
export async function lockWallet(tx: Tx, userId: string, currency: string) {
  const wallet = await tx
    .selectFrom('wallets')
    .selectAll()
    .where('user_id', '=', userId)
    .where('currency', '=', currency)
    .forUpdate()
    .executeTakeFirst();

  if (!wallet) throw new Error(`Кошелёк ${currency} у пользователя ${userId} не найден`);
  return wallet;
}

/**
 * Атомарный инкремент nonce.
 *
 * UPDATE … RETURNING берёт блокировку строки, поэтому конкурентные ставки
 * сериализуются сами. Две параллельные ставки с одинаковым nonce — это два
 * одинаковых ролла у игрока на автобете и справедливое обвинение в мошенничестве.
 */
export async function bumpNonce(tx: Tx, userId: string) {
  const row = await tx
    .updateTable('seed_pairs')
    .set((eb) => ({ nonce: eb('nonce', '+', 1) }))
    .where('user_id', '=', userId)
    .where('active', '=', true)
    .returning(['id', 'server_seed', 'server_seed_hash', 'client_seed', 'nonce'])
    .executeTakeFirst();

  if (!row) throw new Error(`Активной пары сидов у пользователя ${userId} нет`);
  return row;
}

/** Проверка живости соединения — для /health. */
export async function ping(db: Executor): Promise<boolean> {
  await sql`select 1`.execute(db);
  return true;
}

export { sql };
