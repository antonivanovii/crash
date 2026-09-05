import { randomBytes } from '@noble/hashes/utils.js';
import { bytesToHex, sha256Hex } from '../rng/bytes.js';

export const SERVER_SEED_BYTES = 32;
export const CLIENT_SEED_MAX_LENGTH = 64;

export interface SeedPair {
  readonly serverSeed: string;
  readonly serverSeedHash: string;
  readonly clientSeed: string;
  readonly nonce: number;
}

/** Серверный сид — 32 случайных байта в hex. Живёт в vault, не в переменных окружения. */
export function generateServerSeed(): string {
  return bytesToHex(randomBytes(SERVER_SEED_BYTES));
}

/** Публикуется в момент создания пары, задолго до первой ставки. В этом весь коммитмент. */
export function hashServerSeed(serverSeed: string): string {
  return sha256Hex(serverSeed);
}

/**
 * Проверка коммитмента после ротации: раскрытый сид обязан сойтись с хэшем,
 * который игрок видел до розыгрышей.
 */
export function verifyServerSeed(serverSeed: string, publishedHash: string): boolean {
  return timingSafeEqualHex(hashServerSeed(serverSeed), publishedHash);
}

export function generateClientSeed(): string {
  return bytesToHex(randomBytes(8));
}

export function isValidClientSeed(seed: string): boolean {
  return seed.length > 0 && seed.length <= CLIENT_SEED_MAX_LENGTH && /^[\x20-\x7e]+$/.test(seed);
}

/** Сравнение за постоянное время — на случай, если хэш придёт из внешнего ввода. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
