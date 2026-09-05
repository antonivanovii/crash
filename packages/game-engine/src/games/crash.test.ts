import { multiplierFromDecimal } from '@kobold/money';
import { describe, expect, it } from 'vitest';
import { buildChain, chainUniform, verifyChainDepth, verifyChainLink } from '../fairness/chain.js';
import {
  CRASH_CONFIG,
  cashoutMultiplier,
  crashPoint,
  crashPointFromUniform,
  crashTimeMs,
  isCashoutValid,
  multiplierAt,
} from './crash.js';

const SALT = '0000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9012345';

describe('crashPointFromUniform', () => {
  it('совпадает с формулой RTP/(1−r)', () => {
    expect(crashPointFromUniform(0)).toBe(multiplierFromDecimal(1));
    expect(crashPointFromUniform(0.5)).toBe(multiplierFromDecimal(1.98));
    // 0.99/(1−0.99) в double — 98.99999…, флор даёт 98.99. Детерминировано и проверяемо.
    expect(crashPointFromUniform(0.99)).toBe(multiplierFromDecimal(98.99));
  });

  it('клампится в 1.00 ровно там, где формула даёт меньше единицы', () => {
    // Сырое RTP/(1−r) < 1 при r < 1−RTP — это те самые ~1% раундов.
    expect(crashPointFromUniform(0.009)).toBe(100n);
    expect(crashPointFromUniform(1 - CRASH_CONFIG.rtp)).toBe(100n);
  });

  it('доля раундов с 1.00× — 1.98%, а не 1%', () => {
    // Клампится не только r < 1−RTP, но и всё, что флорится в 1.00:
    // граница — r < 1 − RTP/1.01. Разница вдвое, и путать их дорого.
    let instant = 0;
    const n = 200_000;
    for (let i = 0; i < n; i += 1) {
      if (crashPointFromUniform(i / n) === 100n) instant += 1;
    }
    expect(instant / n).toBeCloseTo(1 - CRASH_CONFIG.rtp / 1.01, 3);
  });

  it('капится значением, а не рероллом', () => {
    expect(crashPointFromUniform(0.999999999)).toBe(
      multiplierFromDecimal(CRASH_CONFIG.maxMultiplier),
    );
  });
});

describe('хэш-цепочка', () => {
  const chain = buildChain('deadbeef', 1000);

  it('раунды идут от конца к началу и проверяются вперёд', () => {
    // chain[i] = SHA256(chain[i-1]); играем chain[N], chain[N-1], …
    expect(verifyChainLink(chain[500]!, chain[501]!)).toBe(true);
    expect(verifyChainLink(chain[501]!, chain[500]!)).toBe(false);
  });

  it('проверяется на любую глубину, а не только соседнее звено', () => {
    expect(verifyChainDepth(chain[100]!, chain[200]!, 100)).toBe(true);
    expect(verifyChainDepth(chain[100]!, chain[200]!, 99)).toBe(false);
  });

  it('точка краха зависит от соли — без неё цепочку можно подобрать', () => {
    expect(chainUniform(chain[10]!, SALT)).not.toBe(chainUniform(chain[10]!, 'other-salt'));
    expect(crashPoint(chain[10]!, SALT)).toBe(crashPoint(chain[10]!, SALT));
  });
});

describe('кривая и кэшаут', () => {
  it('множитель растёт экспоненциально: удвоение за 5 секунд', () => {
    expect(multiplierAt(0)).toBe(1);
    expect(multiplierAt(5000)).toBeCloseTo(2, 6);
    expect(multiplierAt(10_000)).toBeCloseTo(4, 6);
  });

  it('время краха обратно кривой', () => {
    const point = multiplierFromDecimal(2);
    expect(crashTimeMs(point)).toBeCloseTo(5000, 3);
    expect(multiplierAt(crashTimeMs(point))).toBeCloseTo(2, 6);
  });

  it('валидность кэшаута решает только серверное время', () => {
    const point = multiplierFromDecimal(2); // крах на 5000 мс
    expect(isCashoutValid(0, 4999, point)).toBe(true);
    expect(isCashoutValid(0, 5001, point)).toBe(false);
  });

  it('множитель кэшаута берётся с флором в пользу дома', () => {
    expect(cashoutMultiplier(0, 5000)).toBe(200n);
    expect(cashoutMultiplier(0, 0)).toBe(100n);
  });
});
