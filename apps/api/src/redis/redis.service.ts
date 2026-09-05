import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.schema.js';

/**
 * Три роли Redis — три логические БД, чтобы они не мешали друг другу:
 * pub/sub раундов, блокировка лидера, кеш и rate limit.
 *
 * Чего в Redis нет и не будет: денег, состояния раунда, точки краха. Redis
 * может исчезнуть целиком — раунд обязан доиграться из Postgres.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly pubsub: Redis;
  readonly locks: Redis;
  readonly cache: Redis;

  constructor(@Inject(ENV) env: Env) {
    const make = (db: number) =>
      new Redis(env.REDIS_URL, { db, lazyConnect: false, maxRetriesPerRequest: null });
    this.pubsub = make(env.REDIS_DB_PUBSUB);
    this.locks = make(env.REDIS_DB_LOCKS);
    this.cache = make(env.REDIS_DB_CACHE);
  }

  /** Отдельное соединение под подписку: подписанный клиент не умеет обычных команд. */
  createSubscriber(): Redis {
    return this.pubsub.duplicate();
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.pubsub.quit(), this.locks.quit(), this.cache.quit()]);
  }
}
