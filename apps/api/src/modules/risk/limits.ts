/**
 * Пределы риска. Пока константы, дальше — таблица и админка; форма вызова
 * при этом не меняется, поэтому переезд дешёвый.
 *
 * Max profit per bet — не украшение. При капе множителя в 1 000 000× игрок
 * с крупной ставкой уносит банк за один раунд, поэтому потолок абсолютной
 * прибыли проверяется ДО приёма ставки, а не после розыгрыша.
 */
export interface GameLimits {
  readonly minStake: bigint;
  readonly maxStake: bigint;
  readonly maxProfit: bigint;
}

const DEFAULTS: Record<string, GameLimits> = {
  RUB: { minStake: 1000n, maxStake: 10_000_000n, maxProfit: 100_000_000n },
  USD: { minStake: 1n, maxStake: 100_000_00n, maxProfit: 1_000_000_00n },
  EUR: { minStake: 1n, maxStake: 100_000_00n, maxProfit: 1_000_000_00n },
  USDT: { minStake: 10_000n, maxStake: 100_000_000_000n, maxProfit: 1_000_000_000_000n },
  BTC: { minStake: 100n, maxStake: 100_000_000n, maxProfit: 1_000_000_000n },
  ETH: { minStake: 1_000n, maxStake: 1_000_000_000n, maxProfit: 10_000_000_000n },
};

export function limitsFor(currency: string): GameLimits {
  const limits = DEFAULTS[currency];
  if (!limits) throw new Error(`Лимиты для валюты ${currency} не заданы`);
  return limits;
}
