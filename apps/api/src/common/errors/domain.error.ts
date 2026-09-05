import { ERROR_CODES, type ErrorCode } from '@kobold/contracts';

/**
 * Доменные ошибки. Бросаются сервисами, ловятся фильтром, превращаются в код
 * и HTTP-статус в одном месте.
 *
 * Тексты для игрока пишутся по тону из Kobold Style: что случилось, что делать
 * и сколько ждать. «Недостаточно средств» без указания, сколько не хватает, —
 * плохой текст.
 */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status = 400,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InsufficientFunds extends DomainError {
  constructor(readonly missing: bigint) {
    super(ERROR_CODES.INSUFFICIENT_FUNDS, 'На балансе не хватает средств для этой ставки.', 400, {
      missing: missing.toString(),
    });
  }
}

export class LimitExceeded extends DomainError {
  constructor(kind: string, limit: bigint) {
    super(ERROR_CODES.LIMIT_EXCEEDED, `Превышен лимит: ${kind}.`, 400, {
      kind,
      limit: limit.toString(),
    });
  }
}

export class MaxProfitExceeded extends DomainError {
  constructor(maxProfit: bigint) {
    super(
      ERROR_CODES.MAX_PROFIT_EXCEEDED,
      'Возможный выигрыш превышает потолок на одну ставку. Уменьши ставку или множитель.',
      400,
      { maxProfit: maxProfit.toString() },
    );
  }
}

export class RoundAlreadyActive extends DomainError {
  constructor(game: string) {
    super(ERROR_CODES.ROUND_ALREADY_ACTIVE, `Раунд в ${game} не завершён.`, 409, { game });
  }
}

export class RoundNotActive extends DomainError {
  constructor(game: string) {
    super(ERROR_CODES.ROUND_NOT_ACTIVE, `Активного раунда в ${game} нет.`, 409, { game });
  }
}

export class GameUnavailable extends DomainError {
  constructor(game: string) {
    super(ERROR_CODES.GAME_UNAVAILABLE, `Игра ${game} сейчас недоступна.`, 503, { game });
  }
}

export class IdempotencyKeyReused extends DomainError {
  constructor() {
    super(
      ERROR_CODES.IDEMPOTENCY_KEY_REUSED,
      'Этот ключ идемпотентности уже использован с другими параметрами.',
      409,
    );
  }
}

export class IdempotencyInProgress extends DomainError {
  constructor() {
    super(ERROR_CODES.IDEMPOTENCY_IN_PROGRESS, 'Предыдущий запрос ещё выполняется.', 409);
  }
}

export class Unauthorized extends DomainError {
  constructor(message = 'Нужна авторизация.') {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
}
