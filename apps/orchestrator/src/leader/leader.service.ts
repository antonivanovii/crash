import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { randomUUID } from 'node:crypto';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.schema.js';

export type LeadershipListener = (isLeader: boolean) => void;

/**
 * Leader election на Redis.
 *
 * Таймер раунда обязан тикать ровно в одном месте: два процесса, двигающих
 * общий раунд, — это два разных множителя crash у разных игроков.
 *
 * Схема стандартная: SET key value NX PX ttl, продление только если значение
 * наше (проверка и продление одним скриптом, иначе можно продлить чужую
 * блокировку). Redis при этом не источник истины: состояние раунда живёт
 * в Postgres, и новый лидер доигрывает раунд, читая его оттуда.
 */
@Injectable()
export class LeaderService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(LeaderService.name);
  private readonly identity = randomUUID();
  private readonly redis: Redis;
  private readonly listeners = new Set<LeadershipListener>();
  private timer?: NodeJS.Timeout;

  private leader = false;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.redis = new Redis(env.REDIS_URL, { db: env.REDIS_DB_LOCKS, maxRetriesPerRequest: null });
  }

  static readonly LOCK_KEY = 'kobold:orchestrator:leader';

  /** Продление только своей блокировки — иначе процесс, потерявший лидерство, вернёт его себе. */
  private static readonly RENEW_SCRIPT = `
    if redis.call('get', KEYS[1]) == ARGV[1] then
      return redis.call('pexpire', KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  get isLeader(): boolean {
    return this.leader;
  }

  onLeadershipChange(listener: LeadershipListener): void {
    this.listeners.add(listener);
  }

  onModuleInit(): void {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.env.LEADER_RENEW_INTERVAL_MS);
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    // Отдаём блокировку явно: следующий лидер поднимется за миллисекунды,
    // а не через TTL.
    if (this.leader) await this.release();
    await this.redis.quit();
  }

  private async tick(): Promise<void> {
    try {
      const held = this.leader
        ? (await this.redis.eval(
            LeaderService.RENEW_SCRIPT,
            1,
            LeaderService.LOCK_KEY,
            this.identity,
            String(this.env.LEADER_LOCK_TTL_MS),
          )) === 1
        : (await this.redis.set(
            LeaderService.LOCK_KEY,
            this.identity,
            'PX',
            this.env.LEADER_LOCK_TTL_MS,
            'NX',
          )) === 'OK';

      this.setLeader(held);
    } catch (error) {
      // Redis недоступен — лидерство складывается. Раунды при этом не
      // теряются: их состояние в Postgres, и лидер, поднявшийся позже,
      // доиграет с того места.
      this.logger.error({ err: error }, 'Ошибка выборов лидера');
      this.setLeader(false);
    }
  }

  private setLeader(next: boolean): void {
    if (next === this.leader) return;
    this.leader = next;
    this.logger.warn(next ? 'Стали лидером' : 'Потеряли лидерство');
    for (const listener of this.listeners) listener(next);
  }

  private async release(): Promise<void> {
    const script = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;
    await this.redis.eval(script, 1, LeaderService.LOCK_KEY, this.identity);
  }
}
