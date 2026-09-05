import { describe, expect, it } from 'vitest';
import { amountSchema, idempotencyKeySchema, multiplierSchema, stakeSchema } from './common.js';
import { games } from './index.js';

describe('деньги на границе API', () => {
  it('приходят строкой и становятся bigint', () => {
    expect(amountSchema.parse('1234')).toBe(1234n);
    expect(amountSchema.parse('0')).toBe(0n);
  });

  it('не теряют точность на больших значениях', () => {
    expect(amountSchema.parse('9007199254740993')).toBe(9_007_199_254_740_993n);
  });

  it('не принимают number и дроби', () => {
    expect(() => amountSchema.parse(1234)).toThrow();
    expect(() => amountSchema.parse('12.34')).toThrow();
    expect(() => amountSchema.parse('-1')).toThrow();
  });

  it('ставка обязана быть положительной', () => {
    expect(() => stakeSchema.parse('0')).toThrow();
    expect(stakeSchema.parse('1')).toBe(1n);
  });
});

describe('ключ идемпотентности', () => {
  it('принимает url-safe строку достаточной длины', () => {
    expect(idempotencyKeySchema.parse('01JC3Q7Z9K8XW2VYT4RB6MHNAE')).toBeTruthy();
  });

  it('отвергает короткое и с мусором', () => {
    expect(() => idempotencyKeySchema.parse('short')).toThrow();
    expect(() => idempotencyKeySchema.parse('has spaces in it here')).toThrow();
  });
});

describe('схемы игр опираются на движок', () => {
  it('limbo не принимает таргет ниже 1.01', () => {
    const base = { currency: 'USD', stake: '100' };
    expect(() => games.limbo.limboBetRequestSchema.parse({ ...base, target: '100' })).toThrow();
    expect(games.limbo.limboBetRequestSchema.parse({ ...base, target: '101' }).target).toBe(101n);
  });

  it('dice отвергает пороги без выигрышных исходов', () => {
    const base = { currency: 'USD', stake: '100' };
    expect(() =>
      games.dice.diceBetRequestSchema.parse({ ...base, target: 0, direction: 'UNDER' }),
    ).toThrow();
    expect(
      games.dice.diceBetRequestSchema.parse({ ...base, target: 5000, direction: 'UNDER' }).target,
    ).toBe(5000);
  });

  it('множитель едет строкой', () => {
    expect(multiplierSchema.parse('198')).toBe(198n);
  });
});
