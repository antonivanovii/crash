import { applyMultiplier, multiplierFromDecimal } from '@kobold/money';
import { describe, expect, it } from 'vitest';
import { uniform } from '../rng/bytes.js';
import { LIMBO_CONFIG, isValidLimboTarget, limboMultiplier, playLimbo } from './limbo.js';

const SERVER = 'f'.repeat(64);
const CLIENT = 'player';

// Полные 10⁷ раундов гоняются локально: SLOW_TESTS=1 pnpm --filter @kobold/game-engine test
const ROUNDS = process.env.SLOW_TESTS ? 10_000_000 : 300_000;

describe('limboMultiplier', () => {
  it('считает по формуле RTP/u с флором до сотых', () => {
    expect(limboMultiplier(0.5)).toBe(multiplierFromDecimal(1.98));
    expect(limboMultiplier(0.99)).toBe(multiplierFromDecimal(1));
    // 0.99/0.0099 в double — это 99.99999999999999, флор даёт 99.99, а не 100.00.
    // Это не баг: розыгрыш детерминирован и опубликован ровно в таком виде,
    // поэтому верификатор в браузере получает то же число, что и сервер.
    expect(limboMultiplier(0.0099)).toBe(multiplierFromDecimal(99.99));
  });

  it('клампит значение, а не отбрасывает раунд', () => {
    expect(limboMultiplier(0)).toBe(multiplierFromDecimal(LIMBO_CONFIG.maxMultiplier));
    expect(limboMultiplier(1e-12)).toBe(multiplierFromDecimal(LIMBO_CONFIG.maxMultiplier));
  });

  it('u > RTP даёт 1.00 — аналог мгновенного краха', () => {
    expect(limboMultiplier(0.995)).toBe(100n);
    expect(limboMultiplier(0.999999)).toBe(100n);
  });

  it('отвергает u вне [0,1)', () => {
    expect(() => limboMultiplier(1)).toThrow(RangeError);
    expect(() => limboMultiplier(-0.1)).toThrow(RangeError);
  });
});

describe('валидация таргета', () => {
  it('минимум 1.01 — на 1.00 выигрыша не бывает', () => {
    expect(isValidLimboTarget(100n)).toBe(false);
    expect(isValidLimboTarget(101n)).toBe(true);
    expect(isValidLimboTarget(multiplierFromDecimal(LIMBO_CONFIG.maxMultiplier))).toBe(true);
    expect(isValidLimboTarget(multiplierFromDecimal(LIMBO_CONFIG.maxMultiplier) + 1n)).toBe(false);
  });
});

describe('playLimbo', () => {
  it('воспроизводится по (сид, сид, nonce) — это и есть верификатор', () => {
    const input = { serverSeed: SERVER, clientSeed: CLIENT, nonce: 42 };
    const a = playLimbo(input, { target: 200n });
    const b = playLimbo(input, { target: 200n });
    expect(a).toEqual(b);
  });

  it('ролл не зависит от таргета', () => {
    const input = { serverSeed: SERVER, clientSeed: CLIENT, nonce: 42 };
    expect(playLimbo(input, { target: 200n }).result.multiplier).toBe(
      playLimbo(input, { target: 5000n }).result.multiplier,
    );
  });

  it('платит по таргету, а не по выпавшему множителю', () => {
    let checked = 0;
    for (let n = 0; n < 500 && checked < 5; n += 1) {
      const out = playLimbo({ serverSeed: SERVER, clientSeed: CLIENT, nonce: n }, { target: 150n });
      if (out.won) {
        expect(out.multiplier).toBe(150n);
        checked += 1;
      } else {
        expect(out.multiplier).toBe(0n);
      }
    }
    expect(checked).toBe(5);
  });
});

describe('RTP сходится к 0.99', () => {
  it.each([1.01, 1.5, 2, 10, 100])('таргет %sx', (targetDecimal) => {
    const target = multiplierFromDecimal(targetDecimal);
    const stake = 1_000_000n;
    let returned = 0n;

    for (let n = 0; n < ROUNDS; n += 1) {
      if (limboMultiplier(uniform(SERVER, CLIENT, n)) >= target) {
        returned += applyMultiplier(stake, target);
      }
    }

    const rtp = Number(returned) / Number(stake * BigInt(ROUNDS));
    // Дисперсия растёт с таргетом: на 100x нужен более широкий допуск.
    const tolerance = Math.max(0.004, 3 * Math.sqrt(targetDecimal / ROUNDS));
    expect(Math.abs(rtp - LIMBO_CONFIG.rtp)).toBeLessThan(tolerance);
  });
});
