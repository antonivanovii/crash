import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

export { bytesToHex, hexToBytes, utf8ToBytes };

export const HMAC_BLOCK_SIZE = 32;

/** HMAC-SHA256(serverSeed, message). Ключ — серверный сид, сообщение — всё остальное. */
export function hmacSha256(key: string | Uint8Array, message: string | Uint8Array): Uint8Array {
  return hmac(
    sha256,
    typeof key === 'string' ? utf8ToBytes(key) : key,
    typeof message === 'string' ? utf8ToBytes(message) : message,
  );
}

export function sha256Hex(data: string | Uint8Array): string {
  return bytesToHex(sha256(typeof data === 'string' ? utf8ToBytes(data) : data));
}

/**
 * Бесконечный поток байтов, детерминированный по (serverSeed, clientSeed, nonce).
 *
 * Блок с индексом b — это HMAC(serverSeed, `${clientSeed}:${nonce}:${b}`).
 * Такая схема даёт неограниченное число байт на один nonce, что нужно играм с
 * многими исходами: расклад Mines, путь шарика в Plinko, перетасовка колоды.
 *
 * Курсор — часть публичного протокола проверки: игрок должен уметь повторить
 * ровно ту же последовательность.
 */
export class ByteStream {
  private block: Uint8Array = new Uint8Array(0);
  private offset = 0;
  private blockIndex: number;

  constructor(
    private readonly serverSeed: string,
    private readonly clientSeed: string,
    private readonly nonce: number,
    startBlock = 0,
  ) {
    this.blockIndex = startBlock;
  }

  private bytesRead = 0;

  /** Сколько байт уже выдано. Пишется в результат раунда — по нему воспроизводится розыгрыш. */
  get consumed(): number {
    return this.bytesRead;
  }

  next(): number {
    if (this.offset >= this.block.length) {
      this.block = hmacSha256(
        this.serverSeed,
        `${this.clientSeed}:${this.nonce}:${this.blockIndex}`,
      );
      this.blockIndex += 1;
      this.offset = 0;
    }
    const byte = this.block[this.offset]!;
    this.offset += 1;
    this.bytesRead += 1;
    return byte;
  }

  take(count: number): Uint8Array {
    const out = new Uint8Array(count);
    for (let i = 0; i < count; i += 1) out[i] = this.next();
    return out;
  }

  /**
   * Число в [0, 1) из 48 бит.
   *
   * Шесть байт, а не четыре: для dice нужно 10000 равных корзин, и 2³²/10000 —
   * не целое, перекос ~2.3·10⁻⁶. На 48 битах он падает до ~3.6·10⁻¹¹.
   * 48 бит целиком помещаются в мантиссу double (53 бита) без потерь.
   */
  uniform(): number {
    return Number(this.uint48()) / 2 ** 48;
  }

  uint48(): bigint {
    let value = 0n;
    for (let i = 0; i < 6; i += 1) value = (value << 8n) | BigInt(this.next());
    return value;
  }

  /**
   * Равномерное целое в [0, bound) без перекоса — rejection sampling.
   *
   * Для 10000 корзин на 48 битах перекос пренебрежим, но для малых алфавитов
   * (карты, тайлы Mines) отбрасывание обязательно: иначе младшие значения
   * встречаются чаще, и это ловится статистикой на первой же выборке.
   */
  intBelow(bound: number): number {
    if (!Number.isInteger(bound) || bound <= 0) {
      throw new RangeError(`Граница должна быть положительным целым, получено ${bound}`);
    }
    const range = BigInt(bound);
    const limit = ((1n << 48n) / range) * range;
    for (;;) {
      const draw = this.uint48();
      if (draw < limit) return Number(draw % range);
    }
  }
}

/**
 * Одно число [0,1) — самый частый случай: атомарная игра с единственным исходом.
 * Эквивалент `new ByteStream(...).uniform()`, вынесен ради читаемости вызова.
 */
export function uniform(serverSeed: string, clientSeed: string, nonce: number): number {
  return new ByteStream(serverSeed, clientSeed, nonce).uniform();
}

/** N независимых чисел [0,1) из одного nonce. */
export function uniformSequence(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
): number[] {
  const stream = new ByteStream(serverSeed, clientSeed, nonce);
  return Array.from({ length: count }, () => stream.uniform());
}

/**
 * Перетасовка Фишера — Йейтса на потоке. Используется там, где исход — это
 * подмножество без повторов: расклад Mines, номера Keno, колода Dragon Tiger.
 */
export function shuffle<T>(items: readonly T[], stream: ByteStream): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = stream.intBelow(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** k различных индексов из [0, n) — выборка без повторов, дешевле полной тасовки. */
export function sampleIndices(n: number, k: number, stream: ByteStream): number[] {
  if (k > n) throw new RangeError(`Нельзя выбрать ${k} из ${n}`);
  const pool = Array.from({ length: n }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < k; i += 1) {
    const j = i + stream.intBelow(n - i);
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    out.push(pool[i]!);
  }
  return out;
}
