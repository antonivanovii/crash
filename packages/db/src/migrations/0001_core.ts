import { sql, type Kysely } from 'kysely';

/**
 * Фундамент: пользователи, леджер двойной записи, кошельки, честность, игры.
 *
 * Всё, что можно нарушить в коде, вынесено в схему: уникальность ключа
 * идемпотентности, один активный раунд на игру, нулевая сумма проводок
 * в транзакции. Это не перестраховка — это единственные гарантии, которые
 * переживают рефакторинг.
 */

export const UP = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,

  // ── Пользователи ──────────────────────────────────────────────────────────
  `CREATE TABLE users (
     id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     email               text        NOT NULL,
     password_hash       text        NOT NULL,
     display_name        text        NOT NULL,
     currency            text        NOT NULL,
     two_factor_secret   text,
     self_excluded_until timestamptz,
     created_at          timestamptz NOT NULL DEFAULT now(),
     updated_at          timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX users_email_key ON users (lower(email))`,

  `CREATE TABLE sessions (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     token_hash text        NOT NULL,
     user_agent text,
     ip         inet,
     expires_at timestamptz NOT NULL,
     revoked_at timestamptz,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX sessions_token_hash_key ON sessions (token_hash)`,
  `CREATE INDEX sessions_user_active_idx ON sessions (user_id) WHERE revoked_at IS NULL`,

  // ── Леджер ────────────────────────────────────────────────────────────────
  `CREATE TABLE accounts (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     owner_type text NOT NULL CHECK (owner_type IN ('USER', 'SYSTEM')),
     owner_id   uuid,
     kind       text NOT NULL CHECK (kind IN ('USER_WALLET', 'ESCROW', 'HOUSE', 'FEE', 'SUBSIDY')),
     currency   text NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     CHECK ((owner_type = 'USER') = (owner_id IS NOT NULL))
   )`,
  // Кошелёк у пользователя ровно один на валюту; системных счетов тоже по одному на вид.
  `CREATE UNIQUE INDEX accounts_user_wallet_key ON accounts (owner_id, currency)
     WHERE kind = 'USER_WALLET'`,
  `CREATE UNIQUE INDEX accounts_system_key ON accounts (kind, currency)
     WHERE owner_type = 'SYSTEM'`,

  `CREATE TABLE transactions (
     id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     kind            text NOT NULL CHECK (kind IN ('DEPOSIT','WITHDRAWAL','BET','SETTLEMENT','REFUND','ADJUSTMENT')),
     idempotency_key text NOT NULL,
     user_id         uuid REFERENCES users (id) ON DELETE SET NULL,
     created_at      timestamptz NOT NULL DEFAULT now()
   )`,
  // Идемпотентность — инвариант схемы. Повтор упирается в индекс, а не в удачу.
  `CREATE UNIQUE INDEX transactions_idempotency_key ON transactions (idempotency_key)`,
  `CREATE INDEX transactions_user_created_idx ON transactions (user_id, created_at DESC)`,

  `CREATE TABLE entries (
     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     tx_id         uuid          NOT NULL REFERENCES transactions (id) ON DELETE RESTRICT,
     account_id    uuid          NOT NULL REFERENCES accounts (id) ON DELETE RESTRICT,
     amount        numeric(38,0) NOT NULL,
     type          text          NOT NULL CHECK (type IN
                     ('DEPOSIT','WITHDRAWAL','BET','PAYOUT','REFUND','ESCROW_LOCK','ESCROW_RELEASE','FEE','BONUS','ADJUSTMENT')),
     balance_after numeric(38,0),
     created_at    timestamptz   NOT NULL DEFAULT now(),
     CHECK (amount <> 0)
   )`,
  `CREATE INDEX entries_tx_idx ON entries (tx_id)`,
  `CREATE INDEX entries_account_created_idx ON entries (account_id, created_at DESC)`,

  // Сумма проводок по транзакции равна нулю. Constraint отложенный: проводки
  // вставляются по одной, и промежуточные состояния законно неуравновешены.
  `CREATE FUNCTION assert_entries_balanced() RETURNS trigger AS $$
   DECLARE
     unbalanced uuid;
   BEGIN
     SELECT tx_id INTO unbalanced
       FROM entries
      WHERE tx_id = COALESCE(NEW.tx_id, OLD.tx_id)
      GROUP BY tx_id
     HAVING sum(amount) <> 0;

     IF unbalanced IS NOT NULL THEN
       RAISE EXCEPTION 'Проводки транзакции % не сходятся в ноль', unbalanced
         USING ERRCODE = 'check_violation';
     END IF;
     RETURN NULL;
   END;
   $$ LANGUAGE plpgsql`,
  `CREATE CONSTRAINT TRIGGER entries_balanced
     AFTER INSERT OR UPDATE OR DELETE ON entries
     DEFERRABLE INITIALLY DEFERRED
     FOR EACH ROW EXECUTE FUNCTION assert_entries_balanced()`,

  `CREATE TABLE wallets (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id    uuid          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     account_id uuid          NOT NULL REFERENCES accounts (id) ON DELETE RESTRICT,
     currency   text          NOT NULL,
     balance    numeric(38,0) NOT NULL DEFAULT 0,
     locked     numeric(38,0) NOT NULL DEFAULT 0,
     version    integer       NOT NULL DEFAULT 0,
     updated_at timestamptz   NOT NULL DEFAULT now(),
     -- Баланс не уходит в минус на уровне БД. Гонка на кошельке ловится здесь,
     -- а не в тесте, который забыли написать.
     CHECK (balance >= 0),
     CHECK (locked >= 0)
   )`,
  `CREATE UNIQUE INDEX wallets_user_currency_key ON wallets (user_id, currency)`,
  `CREATE UNIQUE INDEX wallets_account_key ON wallets (account_id)`,

  // ── Честность ─────────────────────────────────────────────────────────────
  `CREATE TABLE seed_pairs (
     id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id          uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     server_seed      text        NOT NULL,
     server_seed_hash text        NOT NULL,
     client_seed      text        NOT NULL,
     nonce            integer     NOT NULL DEFAULT 0,
     active           boolean     NOT NULL DEFAULT true,
     created_at       timestamptz NOT NULL DEFAULT now(),
     revealed_at      timestamptz,
     CHECK (nonce >= 0),
     -- Раскрытие и активность взаимоисключающи: активный сид не раскрывается.
     CHECK (NOT (active AND revealed_at IS NOT NULL))
   )`,
  `CREATE UNIQUE INDEX seed_pairs_active_key ON seed_pairs (user_id) WHERE active`,
  `CREATE INDEX seed_pairs_user_created_idx ON seed_pairs (user_id, created_at DESC)`,

  `CREATE TABLE hash_chains (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     game       text        NOT NULL,
     salt       text        NOT NULL,
     head_hash  text        NOT NULL,
     cursor     integer     NOT NULL,
     length     integer     NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     CHECK (cursor >= 0 AND cursor <= length)
   )`,
  `CREATE INDEX hash_chains_game_idx ON hash_chains (game)`,

  // ── Игры ──────────────────────────────────────────────────────────────────
  `CREATE TABLE bets (
     id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     idempotency_key text          NOT NULL,
     user_id         uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
     game            text          NOT NULL,
     currency        text          NOT NULL,
     seed_pair_id    uuid          REFERENCES seed_pairs (id) ON DELETE RESTRICT,
     nonce           integer,
     stake           numeric(38,0) NOT NULL CHECK (stake > 0),
     payout          numeric(38,0) NOT NULL DEFAULT 0 CHECK (payout >= 0),
     multiplier      numeric(38,0) NOT NULL DEFAULT 0,
     won             boolean       NOT NULL,
     params          jsonb         NOT NULL,
     result          jsonb         NOT NULL,
     tx_id           uuid          NOT NULL REFERENCES transactions (id) ON DELETE RESTRICT,
     created_at      timestamptz   NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX bets_idempotency_key ON bets (idempotency_key)`,
  // Пара (сид, nonce) уникальна: два одинаковых ролла на автобете — это конец доверия.
  `CREATE UNIQUE INDEX bets_seed_nonce_key ON bets (seed_pair_id, nonce)
     WHERE seed_pair_id IS NOT NULL AND nonce IS NOT NULL`,
  `CREATE INDEX bets_user_created_idx ON bets (user_id, created_at DESC)`,
  `CREATE INDEX bets_game_created_idx ON bets (game, created_at DESC)`,

  `CREATE TABLE rounds (
     id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id      uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
     game         text          NOT NULL,
     status       text          NOT NULL CHECK (status IN ('ACTIVE','CASHED_OUT','BUSTED','EXPIRED')),
     currency     text          NOT NULL,
     seed_pair_id uuid          NOT NULL REFERENCES seed_pairs (id) ON DELETE RESTRICT,
     nonce        integer       NOT NULL,
     stake        numeric(38,0) NOT NULL CHECK (stake > 0),
     hidden_state jsonb         NOT NULL,
     revealed     jsonb         NOT NULL DEFAULT '{}'::jsonb,
     step         integer       NOT NULL DEFAULT 0,
     payout       numeric(38,0),
     created_at   timestamptz   NOT NULL DEFAULT now(),
     closed_at    timestamptz,
     CHECK ((status = 'ACTIVE') = (closed_at IS NULL))
   )`,
  // Один активный раунд на игру. Иначе игрок открывает два Mines с одного баланса.
  `CREATE UNIQUE INDEX rounds_one_active_per_game ON rounds (user_id, game) WHERE status = 'ACTIVE'`,
  `CREATE UNIQUE INDEX rounds_seed_nonce_key ON rounds (seed_pair_id, nonce)`,
  `CREATE INDEX rounds_user_created_idx ON rounds (user_id, created_at DESC)`,

  `CREATE TABLE shared_rounds (
     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     game        text        NOT NULL,
     status      text        NOT NULL CHECK (status IN ('BETTING','RUNNING','SETTLING','SETTLED','VOIDED')),
     chain_id    uuid        NOT NULL REFERENCES hash_chains (id) ON DELETE RESTRICT,
     chain_index integer     NOT NULL,
     seed        text,
     seed_hash   text        NOT NULL,
     outcome     jsonb,
     started_at  timestamptz,
     closes_at   timestamptz,
     settled_at  timestamptz,
     created_at  timestamptz NOT NULL DEFAULT now(),
     -- Сид раскрывается только вместе с расчётом, не раньше.
     CHECK ((seed IS NULL) OR status IN ('SETTLING','SETTLED','VOIDED'))
   )`,
  `CREATE UNIQUE INDEX shared_rounds_chain_key ON shared_rounds (chain_id, chain_index)`,
  // В каждой общей игре в каждый момент времени живёт ровно один незакрытый раунд.
  `CREATE UNIQUE INDEX shared_rounds_one_live_per_game ON shared_rounds (game)
     WHERE status IN ('BETTING','RUNNING','SETTLING')`,
  `CREATE INDEX shared_rounds_game_created_idx ON shared_rounds (game, created_at DESC)`,

  `CREATE TABLE shared_round_bets (
     id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     idempotency_key    text          NOT NULL,
     shared_round_id    uuid          NOT NULL REFERENCES shared_rounds (id) ON DELETE RESTRICT,
     user_id            uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
     currency           text          NOT NULL,
     stake              numeric(38,0) NOT NULL CHECK (stake > 0),
     params             jsonb         NOT NULL DEFAULT '{}'::jsonb,
     auto_cashout       numeric(38,0),
     cashout_multiplier numeric(38,0),
     cashout_at         timestamptz,
     payout             numeric(38,0),
     tx_id              uuid          NOT NULL REFERENCES transactions (id) ON DELETE RESTRICT,
     settled_tx_id      uuid          REFERENCES transactions (id) ON DELETE RESTRICT,
     created_at         timestamptz   NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX shared_round_bets_idempotency_key ON shared_round_bets (idempotency_key)`,
  // Одна ставка на игрока в раунде — иначе экспозиция считается неверно.
  `CREATE UNIQUE INDEX shared_round_bets_one_per_user ON shared_round_bets (shared_round_id, user_id)`,
  `CREATE INDEX shared_round_bets_round_idx ON shared_round_bets (shared_round_id)`,

  // ── Инфраструктура ────────────────────────────────────────────────────────
  `CREATE TABLE idempotency_keys (
     key             text PRIMARY KEY,
     user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     endpoint        text        NOT NULL,
     request_hash    text        NOT NULL,
     status          text        NOT NULL CHECK (status IN ('IN_PROGRESS','COMPLETED')),
     response_status integer,
     response_body   jsonb,
     created_at      timestamptz NOT NULL DEFAULT now(),
     completed_at    timestamptz,
     expires_at      timestamptz NOT NULL
   )`,
  `CREATE INDEX idempotency_keys_expires_idx ON idempotency_keys (expires_at)`,

  `CREATE TABLE user_limits (
     id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id      uuid          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     kind         text          NOT NULL CHECK (kind IN ('DEPOSIT','STAKE','LOSS','SESSION_TIME')),
     period       text          NOT NULL CHECK (period IN ('SINGLE','DAY','WEEK','MONTH')),
     value        numeric(38,0) NOT NULL CHECK (value >= 0),
     -- Ужесточение действует сразу (effective_at = now), ослабление — через сутки.
     effective_at timestamptz   NOT NULL DEFAULT now(),
     created_at   timestamptz   NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX user_limits_lookup_idx ON user_limits (user_id, kind, period, effective_at DESC)`,
];

export const DOWN = [
  `DROP TABLE IF EXISTS user_limits`,
  `DROP TABLE IF EXISTS idempotency_keys`,
  `DROP TABLE IF EXISTS shared_round_bets`,
  `DROP TABLE IF EXISTS shared_rounds`,
  `DROP TABLE IF EXISTS rounds`,
  `DROP TABLE IF EXISTS bets`,
  `DROP TABLE IF EXISTS hash_chains`,
  `DROP TABLE IF EXISTS seed_pairs`,
  `DROP TABLE IF EXISTS wallets`,
  `DROP TRIGGER IF EXISTS entries_balanced ON entries`,
  `DROP TABLE IF EXISTS entries`,
  `DROP FUNCTION IF EXISTS assert_entries_balanced()`,
  `DROP TABLE IF EXISTS transactions`,
  `DROP TABLE IF EXISTS accounts`,
  `DROP TABLE IF EXISTS sessions`,
  `DROP TABLE IF EXISTS users`,
];

export async function up(db: Kysely<unknown>): Promise<void> {
  for (const statement of UP) await sql.raw(statement).execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  for (const statement of DOWN) await sql.raw(statement).execute(db);
}
