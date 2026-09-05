import { describe, expect, it } from 'vitest';
import { numericToBigInt } from './codec.js';
import { GROUP_SEPARATOR, formatAmount, formatMoney, parseAmount } from './format.js';

describe('parseAmount', () => {
  it('разбирает обычные суммы', () => {
    expect(parseAmount('12.34', 'USD')).toBe(1234n);
    expect(parseAmount('0.01', 'USD')).toBe(1n);
    expect(parseAmount('100', 'USD')).toBe(10_000n);
    expect(parseAmount('-5.5', 'USD')).toBe(-550n);
    expect(parseAmount('0.00000001', 'BTC')).toBe(1n);
  });

  it('принимает запятую и пробелы как разделители ввода', () => {
    expect(parseAmount(' 1 234,56 ', 'USD')).toBe(123_456n);
  });

  it('не глотает лишние знаки', () => {
    expect(() => parseAmount('1.234', 'USD')).toThrow(RangeError);
    expect(() => parseAmount('abc', 'USD')).toThrow(RangeError);
    expect(() => parseAmount('', 'USD')).toThrow(RangeError);
  });

  it('не теряет точность на больших значениях', () => {
    const big = '90071992547409910.12';
    expect(parseAmount(big, 'USD')).toBe(9_007_199_254_740_991_012n);
  });
});

describe('formatAmount', () => {
  it('печатает минорные единицы', () => {
    expect(formatAmount(1234n, 'USD')).toBe('12.34');
    expect(formatAmount(1n, 'USD')).toBe('0.01');
    expect(formatAmount(-550n, 'USD')).toBe('-5.50');
    expect(formatAmount(100_000_000n, 'BTC')).toBe('1.00000000');
    expect(formatAmount(100_000_000n, 'BTC', { trimZeros: true })).toBe('1');
  });

  it('группирует разряды', () => {
    expect(formatMoney(123_456_789n, 'USD')).toBe(
      `$1${GROUP_SEPARATOR}234${GROUP_SEPARATOR}567.89`,
    );
  });

  it('узкий неразрывный пробел не ломает обратный разбор', () => {
    expect(parseAmount(formatAmount(123_456_789n, 'USD', { group: true }), 'USD')).toBe(
      123_456_789n,
    );
  });

  it('round-trip с parseAmount', () => {
    for (const raw of ['0.00', '0.01', '1.00', '999999.99']) {
      expect(formatAmount(parseAmount(raw, 'USD'), 'USD')).toBe(raw);
    }
  });
});

describe('numericToBigInt', () => {
  it('принимает строку из драйвера', () => {
    expect(numericToBigInt('1234')).toBe(1234n);
    expect(numericToBigInt('-1')).toBe(-1n);
  });

  it('отказывается от дробей и мусора', () => {
    expect(() => numericToBigInt('12.34')).toThrow(TypeError);
    expect(() => numericToBigInt('1e3')).toThrow(TypeError);
    expect(() => numericToBigInt(null)).toThrow(TypeError);
  });

  it('ловит потерю точности, если NUMERIC пришёл числом', () => {
    expect(() => numericToBigInt(1e30)).toThrow(TypeError);
    expect(numericToBigInt(42)).toBe(42n);
  });
});

describe('позиция знака валюты', () => {
  it('рубль пишется после суммы, доллар — перед', () => {
    expect(formatMoney(128_450n, 'RUB')).toBe(`1${GROUP_SEPARATOR}284,50${GROUP_SEPARATOR}₽`);
    expect(formatMoney(128_450n, 'USD')).toBe(`$1${GROUP_SEPARATOR}284.50`);
  });
});

describe('десятичный разделитель', () => {
  it('у рубля запятая, у доллара точка', () => {
    expect(formatAmount(128_450n, 'RUB')).toBe('1284,50');
    expect(formatAmount(128_450n, 'USD')).toBe('1284.50');
  });

  it('разбор принимает оба разделителя', () => {
    expect(parseAmount('1 284,50', 'RUB')).toBe(128_450n);
    expect(parseAmount('1 284.50', 'RUB')).toBe(128_450n);
  });
});
