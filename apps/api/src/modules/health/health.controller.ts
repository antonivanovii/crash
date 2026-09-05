import { ping } from '@kobold/db';
import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import { RedisService } from '../../redis/redis.service.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly database: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  /** Живость процесса. Отвечает даже когда зависимости лежат. */
  @Get('live')
  live() {
    return { status: 'ok', uptime: process.uptime() };
  }

  /**
   * Готовность принимать трафик. Postgres обязателен: без него нельзя принять
   * ни одной ставки. Redis — нет: pub/sub и кеш можно потерять, раунды при этом
   * доигрываются из Postgres.
   */
  @Get('ready')
  async ready() {
    const [postgres, redis] = await Promise.all([
      ping(this.database.db)
        .then(() => true)
        .catch(() => false),
      this.redis.cache
        .ping()
        .then(() => true)
        .catch(() => false),
    ]);

    return { status: postgres ? 'ok' : 'degraded', postgres, redis };
  }
}
