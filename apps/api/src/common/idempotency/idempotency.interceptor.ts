import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { catchError, from, of, switchMap, tap, throwError } from 'rxjs';
import { Unauthorized } from '../errors/domain.error.js';
import {
  IDEMPOTENT_KEY,
  readIdempotencyKey,
  type IdempotencyOptions,
} from './idempotency.decorator.js';
import { IdempotencyStore } from './idempotency.store.js';

/**
 * Идемпотентность как инфраструктура, а не как дисциплина в каждом сервисе.
 *
 * Ручка помечается `@Idempotent()`, всё остальное происходит здесь: разбор
 * ключа, захват, повтор сохранённого ответа, освобождение ключа при падении.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly store: IdempotencyStore,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const options = this.reflector.get<IdempotencyOptions | undefined>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );
    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: { id: string } }>();
    const userId = request.user?.id;
    if (!userId) return throwError(() => new Unauthorized());

    const key = readIdempotencyKey(request);
    const endpoint = `${request.method} ${request.routeOptions?.url ?? request.url}`;
    const requestHash = IdempotencyStore.hashRequest(request.body);

    return from(
      this.store.claim({ key, userId, endpoint, requestHash, ttlSeconds: options.ttlSeconds }),
    ).pipe(
      switchMap((claim) => {
        if (claim.replay) return of(claim.replay.body);

        return next.handle().pipe(
          tap({
            next: (body: unknown) => {
              void this.store.complete(key, 200, body);
            },
          }),
          catchError((error: unknown) =>
            // Ключ освобождается, чтобы клиент мог честно повторить: неудачная
            // попытка не должна навсегда занять ключ.
            from(this.store.release(key)).pipe(switchMap(() => throwError(() => error))),
          ),
        );
      }),
    );
  }
}
