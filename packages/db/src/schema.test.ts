import { describe, expect, it } from 'vitest';
import { UP } from './migrations/0001_core.js';
import type { Database } from './schema.js';

/**
 * Тип Database и схема в миграции обязаны совпадать. Разъезд здесь означает,
 * что запрос типизируется, а в базе таблицы нет, — и узнаётся это в проде.
 */
const TABLES: Array<keyof Database> = [
  'users',
  'sessions',
  'accounts',
  'transactions',
  'entries',
  'wallets',
  'seed_pairs',
  'hash_chains',
  'bets',
  'rounds',
  'shared_rounds',
  'shared_round_bets',
  'idempotency_keys',
  'user_limits',
];

const sqlText = UP.join('\n');

describe('схема', () => {
  it.each(TABLES)('таблица %s создаётся миграцией', (table) => {
    expect(sqlText).toContain(`CREATE TABLE ${table} (`);
  });

  it('деньги везде numeric(38,0), ни одного float', () => {
    expect(sqlText).not.toMatch(/\b(real|double precision|float)\b/i);
    expect(sqlText).toMatch(/numeric\(38,0\)/);
  });
});

describe('инварианты вынесены в схему, а не в код', () => {
  it('идемпотентность транзакций уникальна', () => {
    expect(sqlText).toContain('CREATE UNIQUE INDEX transactions_idempotency_key');
  });

  it('один активный раунд на игру', () => {
    expect(sqlText).toContain(
      "CREATE UNIQUE INDEX rounds_one_active_per_game ON rounds (user_id, game) WHERE status = 'ACTIVE'",
    );
  });

  it('одна активная пара сидов на игрока', () => {
    expect(sqlText).toContain(
      'CREATE UNIQUE INDEX seed_pairs_active_key ON seed_pairs (user_id) WHERE active',
    );
  });

  it('пара (сид, nonce) не переиспользуется', () => {
    expect(sqlText).toContain('CREATE UNIQUE INDEX bets_seed_nonce_key');
    expect(sqlText).toContain('CREATE UNIQUE INDEX rounds_seed_nonce_key');
  });

  it('баланс не уходит в минус на уровне БД', () => {
    expect(sqlText).toMatch(/CHECK \(balance >= 0\)/);
  });

  it('проводки транзакции сходятся в ноль отложенным триггером', () => {
    expect(sqlText).toContain('CREATE CONSTRAINT TRIGGER entries_balanced');
    expect(sqlText).toContain('DEFERRABLE INITIALLY DEFERRED');
  });

  it('в общей игре живёт один незакрытый раунд', () => {
    expect(sqlText).toContain('CREATE UNIQUE INDEX shared_rounds_one_live_per_game');
  });
});
