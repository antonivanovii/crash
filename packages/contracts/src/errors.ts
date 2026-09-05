/**
 * Доменные коды ошибок. Клиент разбирает именно код, не текст: тексты
 * локализуются и переписываются, код — часть контракта.
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',

  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  STAKE_BELOW_MINIMUM: 'STAKE_BELOW_MINIMUM',
  STAKE_ABOVE_MAXIMUM: 'STAKE_ABOVE_MAXIMUM',
  /** Прибыль по ставке превысила бы потолок — проверяется ДО приёма. */
  MAX_PROFIT_EXCEEDED: 'MAX_PROFIT_EXCEEDED',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  SELF_EXCLUDED: 'SELF_EXCLUDED',
  RATE_LIMITED: 'RATE_LIMITED',

  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  /** Тот же ключ пришёл с другим телом запроса — это баг клиента, а не ретрай. */
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  /** Первый запрос с этим ключом ещё выполняется. */
  IDEMPOTENCY_IN_PROGRESS: 'IDEMPOTENCY_IN_PROGRESS',

  GAME_UNAVAILABLE: 'GAME_UNAVAILABLE',
  ROUND_ALREADY_ACTIVE: 'ROUND_ALREADY_ACTIVE',
  ROUND_NOT_ACTIVE: 'ROUND_NOT_ACTIVE',
  ROUND_CLOSED: 'ROUND_CLOSED',
  BETTING_CLOSED: 'BETTING_CLOSED',
  CASHOUT_TOO_LATE: 'CASHOUT_TOO_LATE',

  SEED_ROTATION_REQUIRED: 'SEED_ROTATION_REQUIRED',
  KILL_SWITCH_ACTIVE: 'KILL_SWITCH_ACTIVE',
  MARKET_SUSPENDED: 'MARKET_SUSPENDED',

  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: unknown;
  /** Сквозной идентификатор для трейсинга — просить его у игрока при разборе. */
  readonly traceId?: string;
}
