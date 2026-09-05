import { bumpNonce, type Tx } from '@kobold/db';
import {
  generateClientSeed,
  generateServerSeed,
  hashServerSeed,
  isValidClientSeed,
} from '@kobold/game-engine';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';

/**
 * Сиды и их ротация.
 *
 * Правила, которые здесь важнее кода:
 *  — серверный сид не покидает сервер, пока пара активна;
 *  — при ротации он раскрывается ВСЕГДА и автоматически, иначе коммитмент
 *    ничего не значит;
 *  — смена клиентского сида форсирует ротацию серверного, иначе игрок подбирает
 *    выгодный клиентский сид под известное поведение серверного.
 */
@Injectable()
export class SeedService {
  constructor(private readonly database: DatabaseService) {}

  async createInitialPair(
    tx: Tx,
    userId: string,
    clientSeed = generateClientSeed(),
  ): Promise<string> {
    const serverSeed = generateServerSeed();
    const row = await tx
      .insertInto('seed_pairs')
      .values({
        user_id: userId,
        server_seed: serverSeed,
        server_seed_hash: hashServerSeed(serverSeed),
        client_seed: clientSeed,
        active: true,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }

  /**
   * Атомарный инкремент nonce внутри транзакции ставки.
   *
   * Две параллельные ставки не должны получить одинаковый nonce: игрок на
   * автобете увидит два одинаковых ролла и будет прав, решив, что его дурят.
   * UPDATE … RETURNING берёт блокировку строки — конкурентные запросы
   * сериализуются сами.
   */
  nextNonce(tx: Tx, userId: string) {
    return bumpNonce(tx, userId);
  }

  /** Публичное состояние: хэш активной пары и текущий nonce, без серверного сида. */
  async activePair(userId: string) {
    const row = await this.database.db
      .selectFrom('seed_pairs')
      .select(['id', 'server_seed_hash', 'client_seed', 'nonce', 'created_at'])
      .where('user_id', '=', userId)
      .where('active', '=', true)
      .executeTakeFirst();
    return row ?? null;
  }

  async history(userId: string, limit = 25) {
    return this.database.db
      .selectFrom('seed_pairs')
      .select([
        'id',
        'server_seed',
        'server_seed_hash',
        'client_seed',
        'nonce',
        'active',
        'created_at',
        'revealed_at',
      ])
      .where('user_id', '=', userId)
      .where('active', '=', false)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
  }

  /**
   * Ротация. Старая пара гасится и раскрывается, новая создаётся с nonce = 0.
   *
   * Порядок важен: частичный уникальный индекс `seed_pairs (user_id) WHERE active`
   * не позволит существовать двум активным парам, поэтому сначала деактивация.
   */
  async rotate(userId: string, clientSeed?: string) {
    if (clientSeed !== undefined && !isValidClientSeed(clientSeed)) {
      throw new Error('Некорректный клиентский сид');
    }

    return this.database.transaction(async (tx) => {
      const current = await tx
        .selectFrom('seed_pairs')
        .selectAll()
        .where('user_id', '=', userId)
        .where('active', '=', true)
        .forUpdate()
        .executeTakeFirst();

      if (current) {
        await tx
          .updateTable('seed_pairs')
          .set({ active: false, revealed_at: new Date() })
          .where('id', '=', current.id)
          .execute();
      }

      const nextClientSeed = clientSeed ?? current?.client_seed ?? generateClientSeed();
      const id = await this.createInitialPair(tx, userId, nextClientSeed);

      const created = await tx
        .selectFrom('seed_pairs')
        .select(['id', 'server_seed_hash', 'client_seed', 'nonce', 'created_at'])
        .where('id', '=', id)
        .executeTakeFirstOrThrow();

      return { revealed: current ?? null, current: created };
    });
  }
}
