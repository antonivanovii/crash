import { ERROR_CODES } from '@kobold/contracts';
import type { Tx } from '@kobold/db';
import { applyMultiplier, type Multiplier } from '@kobold/money';
import { Injectable } from '@nestjs/common';
import { DomainError, LimitExceeded, MaxProfitExceeded } from '../../common/errors/domain.error.js';
import { limitsFor } from './limits.js';

/**
 * Риск. Проверяется ДО приёма ставки и внутри той же транзакции, что и списание.
 *
 * Проверка снаружи транзакции бесполезна: между ней и списанием влезает вторая
 * ставка, и лимит обходится параллелизмом.
 */
@Injectable()
export class RiskService {
  /**
   * Ставка против лимитов игры и потолка прибыли.
   *
   * `maxMultiplier` — максимально возможный множитель по этой ставке. Для Limbo
   * это выбранный таргет, для Mines — множитель на последнем шаге, для crash —
   * кап игры. Считать «среднюю» экспозицию нельзя: банк уносят хвостом, а не
   * матожиданием.
   */
  checkStake(input: { currency: string; stake: bigint; maxMultiplier: Multiplier }): void {
    const limits = limitsFor(input.currency);

    if (input.stake < limits.minStake) {
      throw new DomainError(ERROR_CODES.STAKE_BELOW_MINIMUM, 'Ставка меньше минимальной.', 400, {
        minStake: limits.minStake.toString(),
      });
    }
    if (input.stake > limits.maxStake) {
      throw new DomainError(ERROR_CODES.STAKE_ABOVE_MAXIMUM, 'Ставка больше максимальной.', 400, {
        maxStake: limits.maxStake.toString(),
      });
    }

    const maxProfit = applyMultiplier(input.stake, input.maxMultiplier) - input.stake;
    if (maxProfit > limits.maxProfit) {
      throw new MaxProfitExceeded(limits.maxProfit);
    }
  }

  /**
   * Персональные лимиты игрока: депозит, ставка, потеря, время сессии.
   *
   * Ужесточение применяется мгновенно, ослабление — с задержкой в сутки,
   * поэтому берётся действующая на сейчас запись, а не последняя созданная.
   */
  async checkUserLimits(
    tx: Tx,
    userId: string,
    kind: 'STAKE' | 'DEPOSIT' | 'LOSS',
    amount: bigint,
  ): Promise<void> {
    const limit = await tx
      .selectFrom('user_limits')
      .select(['value', 'period'])
      .where('user_id', '=', userId)
      .where('kind', '=', kind)
      .where('effective_at', '<=', new Date())
      .orderBy('effective_at', 'desc')
      .executeTakeFirst();

    if (!limit) return;
    if (limit.period === 'SINGLE' && amount > limit.value) {
      throw new LimitExceeded(kind, limit.value);
    }
    // Периодические лимиты считаются агрегатом по entries — добавляется вместе
    // с экраном /account/limits, чтобы не городить заглушку с неверной семантикой.
  }

  /** Самоисключение: интерфейс виден, ставки — нет. */
  async assertNotSelfExcluded(tx: Tx, userId: string): Promise<void> {
    const user = await tx
      .selectFrom('users')
      .select('self_excluded_until')
      .where('id', '=', userId)
      .executeTakeFirst();

    if (user?.self_excluded_until && user.self_excluded_until > new Date()) {
      throw new DomainError(ERROR_CODES.SELF_EXCLUDED, 'Аккаунт под самоисключением.', 403, {
        until: user.self_excluded_until.toISOString(),
      });
    }
  }
}
