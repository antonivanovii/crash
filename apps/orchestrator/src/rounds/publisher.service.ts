import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.schema.js';

/**
 * Публикация событий раундов.
 *
 *   orchestrator → Redis pub/sub → gateway (N инстансов) → клиенты
 *
 * Гейтвеи никакой логики раунда не содержат: они аутентифицируют сокет,
 * подписывают на комнату, отдают снапшот и транслируют. Всё.
 */
@Injectable()
export class PublisherService implements OnApplicationShutdown {
  private readonly redis: Redis;

  constructor(@Inject(ENV) env: Env) {
    this.redis = new Redis(env.REDIS_URL, { db: env.REDIS_DB_PUBSUB, maxRetriesPerRequest: null });
  }

  static channel(game: string): string {
    return `kobold:rounds:${game}`;
  }

  async publish(game: string, event: string, payload: unknown): Promise<void> {
    await this.redis.publish(
      PublisherService.channel(game),
      JSON.stringify({ event, payload, at: Date.now() }),
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
