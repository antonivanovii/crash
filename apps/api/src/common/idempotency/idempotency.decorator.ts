import { ERROR_CODES, IDEMPOTENCY_HEADER, idempotencyKeySchema } from '@kobold/contracts';
import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { DomainError } from '../errors/domain.error.js';

export const IDEMPOTENT_KEY = 'kobold:idempotent';

/**
 * Помечает ручку как идемпотентную. Дальше всё делает интерсептор — руками
 * в сервисах ключи не разбираются.
 *
 * `ttlSeconds` — сколько хранится закешированный ответ. Сутки покрывают любой
 * разумный ретрай клиента, включая «телефон был в метро».
 */
export const Idempotent = (ttlSeconds = 86_400) => SetMetadata(IDEMPOTENT_KEY, { ttlSeconds });

export interface IdempotencyOptions {
  ttlSeconds: number;
}

/** Достаёт валидный ключ из заголовка. Отсутствие ключа на денежной ручке — ошибка клиента. */
export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return readIdempotencyKey(request);
  },
);

export function readIdempotencyKey(request: FastifyRequest): string {
  const raw = request.headers[IDEMPOTENCY_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (!value) {
    throw new DomainError(
      ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED,
      `Заголовок ${IDEMPOTENCY_HEADER} обязателен для этой операции.`,
      400,
    );
  }

  const parsed = idempotencyKeySchema.safeParse(value);
  if (!parsed.success) {
    throw new DomainError(
      ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED,
      `Заголовок ${IDEMPOTENCY_HEADER} некорректен: ${parsed.error.issues[0]?.message ?? ''}`,
      400,
    );
  }
  return parsed.data;
}
