/**
 * Арифметика денег. Единственное место в кодовой базе, где деньгам разрешено
 * встречаться с делением.
 *
 * Инварианты:
 *  - величина всегда bigint в минорных единицах;
 *  - деление никогда не «просто /», направление округления указывается явно;
 *  - округление по умолчанию — в пользу дома, и это осознанный выбор, а не побочный эффект.
 */

/** Направление округления при делении. */
export type Rounding = 'floor' | 'ceil' | 'half-up';

export const ZERO = 0n;

export function isZero(a: bigint): boolean {
  return a === ZERO;
}

export function isPositive(a: bigint): boolean {
  return a > ZERO;
}

export function isNegative(a: bigint): boolean {
  return a < ZERO;
}

export function abs(a: bigint): bigint {
  return a < ZERO ? -a : a;
}

export function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export function max(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

export function sum(values: readonly bigint[]): bigint {
  let total = ZERO;
  for (const v of values) total += v;
  return total;
}

export function clamp(value: bigint, lo: bigint, hi: bigint): bigint {
  return min(max(value, lo), hi);
}

/**
 * Деление с округлением вниз (к минус бесконечности), а не к нулю.
 * Нативный BigInt `/` усекает к нулю: (-7n / 2n) === -3n, что для денег неверно —
 * знак не должен менять направление округления.
 */
export function divFloor(a: bigint, b: bigint): bigint {
  if (b === ZERO) throw new RangeError('Деление на ноль');
  const q = a / b;
  // Остаток ненулевой и знаки разные → усечение пошло вверх, компенсируем.
  return a % b !== ZERO && a < ZERO !== b < ZERO ? q - 1n : q;
}

/** Деление с округлением вверх (к плюс бесконечности). */
export function divCeil(a: bigint, b: bigint): bigint {
  if (b === ZERO) throw new RangeError('Деление на ноль');
  const q = a / b;
  return a % b !== ZERO && a < ZERO === b < ZERO ? q + 1n : q;
}

/** Деление с округлением половин вверх по модулю. */
export function divHalfUp(a: bigint, b: bigint): bigint {
  if (b === ZERO) throw new RangeError('Деление на ноль');
  const negative = a < ZERO !== b < ZERO;
  const q = abs(a) * 2n + abs(b);
  const r = q / (abs(b) * 2n);
  return negative ? -r : r;
}

export function divide(a: bigint, b: bigint, rounding: Rounding = 'floor'): bigint {
  switch (rounding) {
    case 'floor':
      return divFloor(a, b);
    case 'ceil':
      return divCeil(a, b);
    case 'half-up':
      return divHalfUp(a, b);
  }
}

/**
 * amount × numerator / denominator в целых числах, без промежуточного float.
 *
 * Порядок операций важен: сначала умножаем, потом делим. Обратный порядок
 * теряет точность на каждой ставке и уводит RTP.
 */
export function mulRatio(
  amount: bigint,
  numerator: bigint,
  denominator: bigint,
  rounding: Rounding = 'floor',
): bigint {
  return divide(amount * numerator, denominator, rounding);
}

/**
 * Округление в пользу дома: выплата игроку — вниз, списание с игрока — вверх.
 * Разница на одной ставке — минорная единица, на миллионе автобетов — статья дохода,
 * которую лучше видеть в коде явно.
 */
export function houseFavouredPayout(stake: bigint, numerator: bigint, denominator: bigint): bigint {
  return mulRatio(stake, numerator, denominator, 'floor');
}

/** Доля в базисных пунктах (1 bp = 0.01%). Комиссии удобно держать именно так. */
export function basisPoints(amount: bigint, bps: number, rounding: Rounding = 'ceil'): bigint {
  if (!Number.isInteger(bps)) throw new RangeError('bps должен быть целым');
  return mulRatio(amount, BigInt(bps), 10_000n, rounding);
}

/** Распределение суммы на N частей без потери единиц: остаток раскидывается по первым частям. */
export function allocate(amount: bigint, weights: readonly bigint[]): bigint[] {
  const total = sum(weights);
  if (total <= ZERO) throw new RangeError('Сумма весов должна быть положительной');

  const parts = weights.map((w) => divFloor(amount * w, total));
  let remainder = amount - sum(parts);

  // Остаток всегда меньше числа частей, поэтому одного прохода достаточно.
  const step = remainder < ZERO ? -1n : 1n;
  for (let i = 0; remainder !== ZERO && i < parts.length; i += 1) {
    parts[i] = parts[i]! + step;
    remainder -= step;
  }
  return parts;
}
