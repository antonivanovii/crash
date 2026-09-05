import type {
  Generated,
  Json,
  JsonNullable,
  Money,
  MoneyNullable,
  Timestamp,
  TimestampNullable,
} from './types.js';

/**
 * Схема БД для Kysely.
 *
 * Здесь только те таблицы, что нужны фундаменту: леджер, кошелёк, честность,
 * игры. Спорт и рынки предсказаний приезжают своими миграциями в фазах 7–8 —
 * см. docs/ARCHITECTURE.md.
 *
 * Ключевой принцип: инварианты живут в схеме, а не в коде. Что можно нарушить
 * в коде — будет нарушено.
 */

export type AccountKind = 'USER_WALLET' | 'ESCROW' | 'HOUSE' | 'FEE' | 'SUBSIDY';
export type OwnerType = 'USER' | 'SYSTEM';
export type TransactionKind =
  'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'SETTLEMENT' | 'REFUND' | 'ADJUSTMENT';
export type EntryType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'BET'
  | 'PAYOUT'
  | 'REFUND'
  | 'ESCROW_LOCK'
  | 'ESCROW_RELEASE'
  | 'FEE'
  | 'BONUS'
  | 'ADJUSTMENT';
export type RoundStatus = 'ACTIVE' | 'CASHED_OUT' | 'BUSTED' | 'EXPIRED';
export type SharedRoundStatus = 'BETTING' | 'RUNNING' | 'SETTLING' | 'SETTLED' | 'VOIDED';
export type IdempotencyStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  display_name: string;
  currency: string;
  two_factor_secret: string | null;
  /** Ужесточение лимитов действует сразу, ослабление — с задержкой в сутки. */
  self_excluded_until: TimestampNullable;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SessionsTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  user_agent: string | null;
  ip: string | null;
  expires_at: Timestamp;
  revoked_at: TimestampNullable;
  created_at: Timestamp;
}

/** Счета двойной записи. HOUSE/FEE/SUBSIDY — системные, по одному на валюту. */
export interface AccountsTable {
  id: Generated<string>;
  owner_type: OwnerType;
  owner_id: string | null;
  kind: AccountKind;
  currency: string;
  created_at: Timestamp;
}

/** Транзакция — единица идемпотентности. Уникальный индекс по ключу и есть защита от двойного списания. */
export interface TransactionsTable {
  id: Generated<string>;
  kind: TransactionKind;
  idempotency_key: string;
  user_id: string | null;
  created_at: Timestamp;
}

/** Проводка. Сумма проводок в транзакции равна нулю — это проверяет триггер, не код. */
export interface EntriesTable {
  id: Generated<string>;
  tx_id: string;
  account_id: string;
  amount: Money;
  type: EntryType;
  /** Баланс кошелька после проводки — то, что показывается в выписке. */
  balance_after: MoneyNullable;
  created_at: Timestamp;
}

/**
 * Денормализованный баланс. Источник истины — сумма проводок; эта таблица нужна
 * ради FOR UPDATE и быстрого чтения. Ночная сверка обязана их сводить.
 */
export interface WalletsTable {
  id: Generated<string>;
  user_id: string;
  account_id: string;
  currency: string;
  balance: Money;
  locked: Money;
  version: Generated<number>;
  updated_at: Timestamp;
}

export interface SeedPairsTable {
  id: Generated<string>;
  user_id: string;
  /** Не отдаётся, пока пара активна. */
  server_seed: string;
  /** Публикуется сразу. */
  server_seed_hash: string;
  client_seed: string;
  nonce: Generated<number>;
  active: boolean;
  created_at: Timestamp;
  revealed_at: TimestampNullable;
}

/** Цепочка для общих раундов. Соль публична и зафиксирована до генерации. */
export interface HashChainsTable {
  id: Generated<string>;
  game: string;
  salt: string;
  head_hash: string;
  /** Индекс следующего звена; цепочка потребляется от конца к началу. */
  cursor: number;
  length: number;
  created_at: Timestamp;
}

/** Атомарная ставка. Хранит ВХОДЫ, а не только исход — иначе раунд не воспроизвести. */
export interface BetsTable {
  id: Generated<string>;
  idempotency_key: string;
  user_id: string;
  game: string;
  currency: string;
  seed_pair_id: string | null;
  nonce: number | null;
  stake: Money;
  payout: Money;
  /** Множитель в сотых. */
  multiplier: Money;
  won: boolean;
  params: Json<Record<string, unknown>>;
  result: Json<Record<string, unknown>>;
  tx_id: string;
  created_at: Timestamp;
}

/** Открытый раунд: Mines, Towers. Скрытое состояние не покидает сервер до раскрытия. */
export interface RoundsTable {
  id: Generated<string>;
  user_id: string;
  game: string;
  status: RoundStatus;
  currency: string;
  seed_pair_id: string;
  nonce: number;
  stake: Money;
  /** Расклад, зафиксированный до первого хода. Наружу не отдаётся. */
  hidden_state: Json<Record<string, unknown>>;
  /** То, что игрок уже открыл. */
  revealed: Json<Record<string, unknown>>;
  step: Generated<number>;
  payout: MoneyNullable;
  created_at: Timestamp;
  closed_at: TimestampNullable;
}

/** Общий раунд: crash, рулетка. Исход пишется ДО перехода в RUNNING. */
export interface SharedRoundsTable {
  id: Generated<string>;
  game: string;
  status: SharedRoundStatus;
  chain_id: string;
  chain_index: number;
  seed: string | null;
  seed_hash: string;
  outcome: JsonNullable<Record<string, unknown>>;
  started_at: TimestampNullable;
  closes_at: TimestampNullable;
  settled_at: TimestampNullable;
  created_at: Timestamp;
}

/** Ставка в общем раунде — отдельно от bets: у неё другой жизненный цикл. */
export interface SharedRoundBetsTable {
  id: Generated<string>;
  idempotency_key: string;
  shared_round_id: string;
  user_id: string;
  currency: string;
  stake: Money;
  params: Json<Record<string, unknown>>;
  auto_cashout: MoneyNullable;
  /** Заполняется в момент приёма кэшаута сервером; заявленный клиентом множитель не участвует. */
  cashout_multiplier: MoneyNullable;
  cashout_at: TimestampNullable;
  payout: MoneyNullable;
  tx_id: string;
  settled_tx_id: string | null;
  created_at: Timestamp;
}

/**
 * Кэш ответов идемпотентных запросов.
 *
 * Отдельно от transactions: ключ покрывает HTTP-операцию целиком, включая
 * ответ, который надо вернуть при ретрае. Хэш запроса ловит переиспользование
 * ключа с другим телом — это баг клиента, а не повтор.
 */
export interface IdempotencyKeysTable {
  key: string;
  user_id: string;
  endpoint: string;
  request_hash: string;
  status: IdempotencyStatus;
  response_status: number | null;
  response_body: JsonNullable<Record<string, unknown>>;
  created_at: Timestamp;
  completed_at: TimestampNullable;
  expires_at: Timestamp;
}

/** Лимиты игрока. Ужесточение мгновенно, ослабление отложено — отсюда effective_at. */
export interface UserLimitsTable {
  id: Generated<string>;
  user_id: string;
  kind: string;
  period: string;
  value: Money;
  effective_at: Timestamp;
  created_at: Timestamp;
}

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  accounts: AccountsTable;
  transactions: TransactionsTable;
  entries: EntriesTable;
  wallets: WalletsTable;
  seed_pairs: SeedPairsTable;
  hash_chains: HashChainsTable;
  bets: BetsTable;
  rounds: RoundsTable;
  shared_rounds: SharedRoundsTable;
  shared_round_bets: SharedRoundBetsTable;
  idempotency_keys: IdempotencyKeysTable;
  user_limits: UserLimitsTable;
}
