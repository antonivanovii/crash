import { Injectable, Logger } from '@nestjs/common';
import { LeaderService } from '../leader/leader.service.js';
import { PublisherService } from './publisher.service.js';

/**
 * Каркас общего раунда.
 *
 * Стейт-машина crash:
 *   BETTING (5 с) → RUNNING → CRASHED (расчёт) → пауза 3 с → BETTING
 *
 * Два инварианта, которые нельзя нарушать при реализации конкретной игры:
 *
 *  1. Точка краха и startedAt пишутся в БД ДО перехода в RUNNING. Иначе падение
 *     оркестратора становится способом отменить неудобный раунд — а это уже не
 *     надёжность, а честность.
 *
 *  2. Множитель не транслируется. Он детерминированная функция времени, клиент
 *     считает его сам. Сервер шлёт три вида событий: старт, кэшауты пачками
 *     по 100 мс и крах. Иначе на каждого подключённого уходит 60 сообщений
 *     в секунду вместо трёх на раунд.
 *
 * Здесь только каркас и подписка на лидерство: сама игра приезжает вместе
 * с модулем crash (фаза 5 плана).
 */
@Injectable()
export abstract class SharedRoundRunner {
  protected readonly logger = new Logger(this.constructor.name);
  private running = false;

  protected constructor(
    protected readonly leader: LeaderService,
    protected readonly publisher: PublisherService,
    protected readonly game: string,
  ) {
    this.leader.onLeadershipChange((isLeader) => {
      if (isLeader) void this.start();
      else this.stop();
    });
  }

  /** Абстрактный цикл: один проход стейт-машины. Реализуется конкретной игрой. */
  protected abstract runRound(): Promise<void>;

  /**
   * Восстановление после смены лидера: новый лидер читает незакрытый раунд
   * из Postgres и доигрывает его, а не начинает новый.
   */
  protected abstract recover(): Promise<void>;

  private async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.logger.log(`Оркестрация ${this.game} запущена`);

    try {
      await this.recover();
      while (this.running && this.leader.isLeader) {
        await this.runRound();
      }
    } catch (error) {
      this.logger.error({ err: error }, `Цикл ${this.game} упал`);
    } finally {
      this.running = false;
    }
  }

  private stop(): void {
    this.running = false;
    this.logger.warn(`Оркестрация ${this.game} остановлена: лидерство потеряно`);
  }
}
