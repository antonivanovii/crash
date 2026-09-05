import { multiplierFromDecimal } from '@kobold/money';
import { describe, expect, it } from 'vitest';
import { uniform } from '../rng/bytes.js';
import {
  DICE_OUTCOMES,
  diceMultiplier,
  diceRoll,
  diceWinChance,
  isValidDiceTarget,
  playDice,
} from './dice.js';

const SERVER = '1'.repeat(64);
const CLIENT = 'player';

describe('diceRoll', () => {
  it('даёт 0 … 9999', () => {
    expect(diceRoll(0)).toBe(0);
    expect(diceRoll(0.99999999)).toBe(9999);
    expect(diceRoll(0.5)).toBe(5000);
  });

  it('равномерен по 10000 корзинам (хи-квадрат)', () => {
    const bins = new Array<number>(DICE_OUTCOMES).fill(0);
    const n = 2_000_000;
    for (let i = 0; i < n; i += 1) bins[diceRoll(uniform(SERVER, CLIENT, i))]! += 1;

    const expected = n / DICE_OUTCOMES;
    const chi2 = bins.reduce((acc, o) => acc + (o - expected) ** 2 / expected, 0);
    // 9999 степеней свободы: среднее ≈ df, отклонение ≈ sqrt(2·df) ≈ 141. 4σ — с запасом.
    expect(chi2).toBeGreaterThan(DICE_OUTCOMES - 1 - 4 * 141);
    expect(chi2).toBeLessThan(DICE_OUTCOMES - 1 + 4 * 141);
  });
});

describe('множители', () => {
  it('50.00 UNDER даёт классические 1.98x', () => {
    expect(diceMultiplier({ target: 5000, direction: 'UNDER' })).toBe(multiplierFromDecimal(1.98));
  });

  it('UNDER и OVER симметричны относительно 49.995', () => {
    expect(diceWinChance({ target: 2500, direction: 'UNDER' })).toBeCloseTo(0.25, 10);
    expect(diceWinChance({ target: 7499, direction: 'OVER' })).toBeCloseTo(0.25, 10);
  });

  it('эдж дома никогда не уходит в пользу игрока', () => {
    // Флор множителя до сотых добавляет к эджу до ~1% при высоком шансе:
    // на 98% выигрышных исходов множитель 1.0102 округляется до 1.01.
    // Направление всегда одно — в пользу дома, и это проверяется, а не подразумевается.
    for (const direction of ['UNDER', 'OVER'] as const) {
      for (let t = 100; t <= 9800; t += 1) {
        const params = { target: t, direction };
        if (!isValidDiceTarget(params)) continue;
        const ev = (Number(diceMultiplier(params)) / 100) * diceWinChance(params);
        expect(ev).toBeLessThanOrEqual(0.99);
        expect(ev).toBeGreaterThanOrEqual(0.98);
      }
    }
  });
});

describe('валидация порога', () => {
  it('отсекает края и дроби', () => {
    expect(isValidDiceTarget({ target: 0, direction: 'UNDER' })).toBe(false);
    expect(isValidDiceTarget({ target: 9900, direction: 'UNDER' })).toBe(false);
    expect(isValidDiceTarget({ target: 50.5, direction: 'UNDER' })).toBe(false);
    expect(isValidDiceTarget({ target: 5000, direction: 'UNDER' })).toBe(true);
    expect(isValidDiceTarget({ target: 5000, direction: 'OVER' })).toBe(true);
    // 9998 OVER оставляет ровно один выигрышный исход — это край, но законный.
    expect(isValidDiceTarget({ target: 9998, direction: 'OVER' })).toBe(true);
    expect(isValidDiceTarget({ target: 9999, direction: 'OVER' })).toBe(false);
    expect(isValidDiceTarget({ target: 99, direction: 'OVER' })).toBe(false);
  });
});

describe('playDice', () => {
  it('ролл не зависит от таргета и направления', () => {
    const input = { serverSeed: SERVER, clientSeed: CLIENT, nonce: 11 };
    const a = playDice(input, { target: 2500, direction: 'UNDER' });
    const b = playDice(input, { target: 7500, direction: 'OVER' });
    expect(a.result.roll).toBe(b.result.roll);
  });

  it('воспроизводится', () => {
    const input = { serverSeed: SERVER, clientSeed: CLIENT, nonce: 11 };
    expect(playDice(input, { target: 2500, direction: 'UNDER' })).toEqual(
      playDice(input, { target: 2500, direction: 'UNDER' }),
    );
  });
});
