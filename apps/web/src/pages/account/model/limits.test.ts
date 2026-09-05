import { describe, expect, it } from 'vitest';
import { cancelPending, isRelaxation, requestLimitChange } from './limits.js';

const NOW = new Date('2026-08-25T13:41:00Z');

describe('смена лимита', () => {
  it('ужесточение применяется сразу', () => {
    const next = requestLimitChange({ value: 2_000_000n }, 500_000n, NOW);

    expect(next.value).toBe(500_000n);
    expect(next.pending).toBeUndefined();
  });

  it('ослабление откладывается на сутки', () => {
    const next = requestLimitChange({ value: 2_000_000n }, 5_000_000n, NOW);

    // Действующее значение не меняется — иначе сутки отсрочки ничего не значат.
    expect(next.value).toBe(2_000_000n);
    expect(next.pending?.value).toBe(5_000_000n);
    expect(next.pending!.effectiveAt.getTime() - NOW.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('ужесточение отменяет висящее ослабление', () => {
    const relaxed = requestLimitChange({ value: 2_000_000n }, 5_000_000n, NOW);
    const tightened = requestLimitChange(relaxed, 1_000_000n, NOW);

    expect(tightened.value).toBe(1_000_000n);
    expect(tightened.pending).toBeUndefined();
  });

  it('заявку можно отозвать', () => {
    const relaxed = requestLimitChange({ value: 2_000_000n }, 5_000_000n, NOW);

    expect(cancelPending(relaxed)).toEqual({ value: 2_000_000n });
  });

  it('равное значение не считается ослаблением', () => {
    expect(isRelaxation(2_000_000n, 2_000_000n)).toBe(false);
  });
});
