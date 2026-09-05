import { describe, expect, it } from 'vitest';
import { ByteStream, sampleIndices, shuffle, uniform, uniformSequence } from './bytes.js';

const SERVER = 'a'.repeat(64);
const CLIENT = 'client-seed';

describe('uniform', () => {
  it('детерминирован: одни входы → один выход', () => {
    const a = uniform(SERVER, CLIENT, 1);
    const b = uniform(SERVER, CLIENT, 1);
    expect(a).toBe(b);
  });

  it('меняется при смене любого входа', () => {
    const base = uniform(SERVER, CLIENT, 1);
    expect(uniform(SERVER, CLIENT, 2)).not.toBe(base);
    expect(uniform(SERVER, 'other', 1)).not.toBe(base);
    expect(uniform('b'.repeat(64), CLIENT, 1)).not.toBe(base);
  });

  it('лежит в [0,1)', () => {
    for (let n = 0; n < 2000; n += 1) {
      const u = uniform(SERVER, CLIENT, n);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
  });

  it('распределён равномерно (хи-квадрат по 100 корзинам)', () => {
    const bins = new Array<number>(100).fill(0);
    const n = 100_000;
    for (let i = 0; i < n; i += 1) bins[Math.floor(uniform(SERVER, CLIENT, i) * 100)]! += 1;

    const expected = n / 100;
    const chi2 = bins.reduce((acc, o) => acc + (o - expected) ** 2 / expected, 0);
    // 99 степеней свободы, критическое значение при p=0.001 — 148.2
    expect(chi2).toBeLessThan(148.2);
  });
});

describe('ByteStream', () => {
  it('пересекает границу блока без разрывов', () => {
    const a = new ByteStream(SERVER, CLIENT, 0);
    const first = Array.from(a.take(80));

    const b = new ByteStream(SERVER, CLIENT, 0);
    const second = [...Array.from(b.take(30)), ...Array.from(b.take(50))];

    expect(second).toEqual(first);
  });

  it('считает выданные байты', () => {
    const s = new ByteStream(SERVER, CLIENT, 0);
    s.take(40);
    expect(s.consumed).toBe(40);
    s.uniform();
    expect(s.consumed).toBe(46);
  });

  it('intBelow держится в границах и не имеет перекоса на малом алфавите', () => {
    const counts = new Array<number>(6).fill(0);
    const draws = 60_000;
    const stream = new ByteStream(SERVER, CLIENT, 7);
    for (let i = 0; i < draws; i += 1) {
      const v = stream.intBelow(6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
      counts[v]! += 1;
    }
    const expected = draws / 6;
    const chi2 = counts.reduce((acc, o) => acc + (o - expected) ** 2 / expected, 0);
    // 5 степеней свободы, p=0.001 → 20.5
    expect(chi2).toBeLessThan(20.5);
  });

  it('отвергает некорректную границу', () => {
    const s = new ByteStream(SERVER, CLIENT, 0);
    expect(() => s.intBelow(0)).toThrow(RangeError);
    expect(() => s.intBelow(1.5)).toThrow(RangeError);
  });
});

describe('uniformSequence', () => {
  it('повторяет поток из одного nonce', () => {
    expect(uniformSequence(SERVER, CLIENT, 3, 5)).toEqual(uniformSequence(SERVER, CLIENT, 3, 5));
  });

  it('первое значение совпадает с uniform()', () => {
    expect(uniformSequence(SERVER, CLIENT, 3, 1)[0]).toBe(uniform(SERVER, CLIENT, 3));
  });
});

describe('shuffle / sampleIndices', () => {
  it('перестановка сохраняет состав', () => {
    const items = Array.from({ length: 52 }, (_, i) => i);
    const shuffled = shuffle(items, new ByteStream(SERVER, CLIENT, 1));
    expect(shuffled.slice().sort((a, b) => a - b)).toEqual(items);
    expect(shuffled).not.toEqual(items);
  });

  it('перестановка детерминирована', () => {
    const items = Array.from({ length: 52 }, (_, i) => i);
    expect(shuffle(items, new ByteStream(SERVER, CLIENT, 1))).toEqual(
      shuffle(items, new ByteStream(SERVER, CLIENT, 1)),
    );
  });

  it('выборка без повторов', () => {
    const picked = sampleIndices(25, 5, new ByteStream(SERVER, CLIENT, 9));
    expect(picked).toHaveLength(5);
    expect(new Set(picked).size).toBe(5);
    expect(Math.max(...picked)).toBeLessThan(25);
  });

  it('нельзя выбрать больше, чем есть', () => {
    expect(() => sampleIndices(3, 4, new ByteStream(SERVER, CLIENT, 0))).toThrow(RangeError);
  });
});
