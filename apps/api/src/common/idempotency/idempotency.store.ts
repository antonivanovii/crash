import { serializeBigInts } from '@kobold/money';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DatabaseService } from '../../database/database.service.js';
import { IdempotencyInProgress, IdempotencyKeyReused } from '../errors/domain.error.js';

export interface ClaimResult {
  /** Ответ уже посчитан — вернуть его как есть, ничего не выполняя. */
  replay?: { status: number; body: unknown };
}

/**
 * Хранилище ключей идемпотентности.
 *
 * Зачем оно, если в `transactions` уже есть уникальный индекс по ключу: индекс
 * гарантирует, что денежная операция не выполнится дважды, но не хранит ответ.
 * Клиент, потерявший ответ на сети, должен получить ТОТ ЖЕ ответ, а не ошибку
 * уникальности. Отсюда две сущности — гарантия в леджере, кеш ответа здесь.
 */
@Injectable()
export class IdempotencyStore {
  constructor(private readonly database: DatabaseService) {}

  static hashRequest(payload: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(serializeBigInts(payload) ?? null))
      .digest('hex');
  }

  /**
   * Захватывает ключ. Возвращает сохранённый ответ, если операция уже завершилась.
   *
   * Гонка двух одновременных запросов с одним ключом разрешается уникальным
   * первичным ключом: один вставляется, второй видит IN_PROGRESS и получает 409.
   */
  async claim(input: {
    key: string;
    userId: string;
    endpoint: string;
    requestHash: string;
    ttlSeconds: number;
  }): Promise<ClaimResult> {
    const expiresAt = new Date(Date.now() + input.ttlSeconds * 1000);

    const inserted = await this.database.db
      .insertInto('idempotency_keys')
      .values({
        key: input.key,
        user_id: input.userId,
        endpoint: input.endpoint,
        request_hash: input.requestHash,
        status: 'IN_PROGRESS',
        expires_at: expiresAt,
      })
      .onConflict((oc) => oc.column('key').doNothing())
      .returning('key')
      .executeTakeFirst();

    if (inserted) return {};

    const existing = await this.database.db
      .selectFrom('idempotency_keys')
      .selectAll()
      .where('key', '=', input.key)
      .executeTakeFirst();

    // Строку могли удалить по TTL между вставкой и чтением — тогда пробуем заново.
    if (!existing) return this.claim(input);

    // Тот же ключ с другим телом — это баг клиента, а не повтор. Молча выполнить
    // вторую операцию было бы худшим из возможных вариантов.
    if (existing.request_hash !== input.requestHash || existing.endpoint !== input.endpoint) {
      throw new IdempotencyKeyReused();
    }

    if (existing.status === 'IN_PROGRESS') throw new IdempotencyInProgress();

    return {
      replay: {
        status: existing.response_status ?? 200,
        body: existing.response_body,
      },
    };
  }

  async complete(key: string, status: number, body: unknown): Promise<void> {
    await this.database.db
      .updateTable('idempotency_keys')
      .set({
        status: 'COMPLETED',
        response_status: status,
        response_body: serializeBigInts(body) as Record<string, unknown>,
        completed_at: new Date(),
      })
      .where('key', '=', key)
      .execute();
  }

  /** Провалившийся запрос освобождает ключ: клиент вправе повторить попытку. */
  async release(key: string): Promise<void> {
    await this.database.db
      .deleteFrom('idempotency_keys')
      .where('key', '=', key)
      .where('status', '=', 'IN_PROGRESS')
      .execute();
  }

  /** Уборка истёкших ключей. Вызывается ночным заданием из settler. */
  async purgeExpired(): Promise<number> {
    const result = await this.database.db
      .deleteFrom('idempotency_keys')
      .where('expires_at', '<', new Date())
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }
}
