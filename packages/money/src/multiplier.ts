import { divFloor } from './amount.js';

/**
 * Множители живут в сотых долях целым числом: 1.98x → 198n.
 *
 * Причина простая: `1.99` в double — это 1.9899999999999999911182…, и
 * `stake * 1.99` на больших ставках уедет на минорную единицу в непредсказуемую
 * сторону. В сотых всё точно, а два знака — ровно та точность, которую
 * показывает интерфейс.
 */
export const MULTIPLIER_SCALE = 100n;
export const MULTIPLIER_DECIMALS = 2;

/** Множитель в сотых долях. */
export type Multiplier = bigint;

const EPSILON = 1e-9;

/** 2.5 → 250n. Значение обязано быть представимым в двух знаках. */
export function multiplierFromDecimal(value: number): Multiplier {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`Некорректный множитель: ${value}`);
  }
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > EPSILON * Math.max(1, scaled)) {
    throw new RangeError(`Множитель ${value} не укладывается в два знака`);
  }
  return BigInt(rounded);
}

/** 250n → 2.5. Только для отображения и для математики движка, не для денег. */
export function multiplierToDecimal(m: Multiplier): number {
  return Number(m) / 100;
}

/** Форматирование в каноничный вид «2.50x». */
export function formatMultiplier(m: Multiplier, decimals = MULTIPLIER_DECIMALS): string {
  const negative = m < 0n;
  const digits = (negative ? -m : m).toString().padStart(3, '0');
  const whole = digits.slice(0, -2);
  const frac = digits.slice(-2).padEnd(decimals, '0').slice(0, decimals);
  const body = decimals > 0 ? `${whole}.${frac}` : whole;
  return `${negative ? '-' : ''}${body}`;
}

/**
 * Выплата по ставке. Флор всегда — в пользу дома, см. GAMES.md «Округления и лимиты».
 * Возвращает полную выплату (включая возврат ставки), а не прибыль.
 */
export function applyMultiplier(stake: bigint, m: Multiplier): bigint {
  if (stake < 0n) throw new RangeError('Ставка не может быть отрицательной');
  if (m < 0n) throw new RangeError('Множитель не может быть отрицательным');
  return divFloor(stake * m, MULTIPLIER_SCALE);
}

/** Прибыль = выплата − ставка. Именно она проверяется против max profit per bet. */
export function profitOf(stake: bigint, m: Multiplier): bigint {
  return applyMultiplier(stake, m) - stake;
}
