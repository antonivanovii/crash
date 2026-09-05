import { describe, expect, it } from 'vitest';
import { allocate, basisPoints, divCeil, divFloor, divHalfUp, mulRatio, sum } from './amount.js';

describe('divFloor', () => {
  it('округляет вниз, а не к нулю', () => {
    expect(divFloor(7n, 2n)).toBe(3n);
    expect(divFloor(-7n, 2n)).toBe(-4n);
    expect(divFloor(7n, -2n)).toBe(-4n);
    expect(divFloor(-7n, -2n)).toBe(3n);
    expect(divFloor(8n, 2n)).toBe(4n);
  });

  it('отличается от нативного BigInt-деления на отрицательных', () => {
    expect(-7n / 2n).toBe(-3n);
    expect(divFloor(-7n, 2n)).toBe(-4n);
  });

  it('бросается на делении на ноль', () => {
    expect(() => divFloor(1n, 0n)).toThrow(RangeError);
  });
});

describe('divCeil', () => {
  it('округляет вверх', () => {
    expect(divCeil(7n, 2n)).toBe(4n);
    expect(divCeil(-7n, 2n)).toBe(-3n);
    expect(divCeil(8n, 2n)).toBe(4n);
  });
});

describe('divHalfUp', () => {
  it('округляет половины по модулю вверх', () => {
    expect(divHalfUp(5n, 2n)).toBe(3n);
    expect(divHalfUp(-5n, 2n)).toBe(-3n);
    expect(divHalfUp(4n, 2n)).toBe(2n);
  });
});

describe('mulRatio', () => {
  it('умножает до деления — точность не теряется', () => {
    // 1 * 2 / 3 при обратном порядке дало бы 0
    expect(mulRatio(100n, 2n, 3n)).toBe(66n);
    expect(mulRatio(100n, 2n, 3n, 'ceil')).toBe(67n);
  });

  it('держит большие суммы без потери точности', () => {
    const huge = 10n ** 30n;
    expect(mulRatio(huge, 199n, 100n)).toBe(199n * 10n ** 28n);
  });
});

describe('basisPoints', () => {
  it('считает комиссию в базисных пунктах', () => {
    expect(basisPoints(10_000n, 250)).toBe(250n); // 2.5%
    expect(basisPoints(1n, 1, 'ceil')).toBe(1n); // комиссия не проваливается в ноль
    expect(basisPoints(1n, 1, 'floor')).toBe(0n);
  });
});

describe('allocate', () => {
  it('раскидывает без потери минорных единиц', () => {
    const parts = allocate(100n, [1n, 1n, 1n]);
    expect(sum(parts)).toBe(100n);
    expect(parts).toEqual([34n, 33n, 33n]);
  });

  it('уважает веса', () => {
    const parts = allocate(1000n, [70n, 30n]);
    expect(parts).toEqual([700n, 300n]);
  });

  it('работает на отрицательных суммах', () => {
    expect(sum(allocate(-100n, [1n, 1n, 1n]))).toBe(-100n);
  });
});
