import { describe, expect, it } from 'vitest';
import {
  applyMultiplier,
  formatMultiplier,
  multiplierFromDecimal,
  multiplierToDecimal,
  profitOf,
} from './multiplier.js';

describe('multiplierFromDecimal', () => {
  it('переводит в сотые без сюрпризов double', () => {
    expect(multiplierFromDecimal(1.99)).toBe(199n);
    expect(multiplierFromDecimal(1.98)).toBe(198n);
    expect(multiplierFromDecimal(2)).toBe(200n);
    expect(multiplierFromDecimal(1000000)).toBe(100_000_000n);
  });

  it('отказывается от значений тоньше двух знаков', () => {
    expect(() => multiplierFromDecimal(1.234)).toThrow(RangeError);
    expect(() => multiplierFromDecimal(-1)).toThrow(RangeError);
  });
});

describe('applyMultiplier', () => {
  it('округляет выплату вниз — в пользу дома', () => {
    // 333 * 1.99 = 662.67 → 662
    expect(applyMultiplier(333n, 199n)).toBe(662n);
    expect(applyMultiplier(100n, 198n)).toBe(198n);
    expect(applyMultiplier(0n, 500n)).toBe(0n);
  });

  it('прибыль отличается от выплаты на размер ставки', () => {
    expect(profitOf(100n, 198n)).toBe(98n);
    expect(profitOf(100n, 100n)).toBe(0n);
  });
});

describe('formatMultiplier', () => {
  it('печатает канонично', () => {
    expect(formatMultiplier(199n)).toBe('1.99');
    expect(formatMultiplier(100n)).toBe('1.00');
    expect(formatMultiplier(5n)).toBe('0.05');
    expect(formatMultiplier(100_000_000n)).toBe('1000000.00');
  });
});

describe('round-trip', () => {
  it('decimal → hundredths → decimal', () => {
    for (const value of [1, 1.01, 1.5, 2.75, 99.99, 12345.67]) {
      expect(multiplierToDecimal(multiplierFromDecimal(value))).toBeCloseTo(value, 10);
    }
  });
});
