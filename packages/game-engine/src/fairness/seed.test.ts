import { describe, expect, it } from 'vitest';
import {
  generateClientSeed,
  generateServerSeed,
  hashServerSeed,
  isValidClientSeed,
  verifyServerSeed,
} from './seed.js';

describe('серверный сид', () => {
  it('32 байта в hex и каждый раз новый', () => {
    const a = generateServerSeed();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(generateServerSeed());
  });

  it('коммитмент сходится после раскрытия', () => {
    const seed = generateServerSeed();
    const hash = hashServerSeed(seed);
    expect(verifyServerSeed(seed, hash)).toBe(true);
    expect(verifyServerSeed(generateServerSeed(), hash)).toBe(false);
  });

  it('хэш стабилен — иначе история непроверяема', () => {
    expect(hashServerSeed('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('клиентский сид', () => {
  it('генерируется печатаемым', () => {
    expect(isValidClientSeed(generateClientSeed())).toBe(true);
  });

  it('отвергает пустой, длинный и непечатаемый', () => {
    expect(isValidClientSeed('')).toBe(false);
    expect(isValidClientSeed('x'.repeat(65))).toBe(false);
    expect(isValidClientSeed('bad\nseed')).toBe(false);
    expect(isValidClientSeed('my-lucky-seed')).toBe(true);
  });
});
