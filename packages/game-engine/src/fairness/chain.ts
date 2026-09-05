import { hmacSha256, sha256Hex } from '../rng/bytes.js';

/**
 * Хэш-цепочка для общих раундов (crash, рулетка, общий тираж).
 *
 * Раунд общий, персонального client_seed не существует, поэтому коммитмент
 * устроен иначе: цепочка seed_i = SHA256(seed_{i+1}) строится заранее, публикуется
 * её голова, а раунды идут от конца к началу. Игрок проверяет SHA256(seed_i) == seed_{i-1};
 * подмена задним числом равносильна поиску прообраза SHA-256.
 *
 * Публичная соль обязательна. Без неё дом может перегенерировать миллион цепочек
 * и выбрать удобную — конструкция становится декоративной. Классика: хэш будущего
 * блока биткоина, зафиксированный и опубликованный до старта цепочки.
 */

/** Следующее (более раннее по времени игры) звено. */
export function nextChainLink(seed: string): string {
  return sha256Hex(seed);
}

/** Игрок проверяет, что раскрытый сид действительно предшествует уже известному. */
export function verifyChainLink(revealedSeed: string, previouslyRevealed: string): boolean {
  return nextChainLink(revealedSeed) === previouslyRevealed;
}

/**
 * Проверка на глубину: сид раунда i должен за (j − i) хэширований дойти до
 * уже раскрытого сида раунда j. Так проверяется любой раунд, а не только соседний.
 */
export function verifyChainDepth(seed: string, target: string, depth: number): boolean {
  if (depth < 0) return false;
  let current = seed;
  for (let i = 0; i < depth; i += 1) current = nextChainLink(current);
  return current === target;
}

/** Число [0,1) из звена цепочки и публичной соли. */
export function chainUniform(chainSeed: string, salt: string): number {
  const digest = hmacSha256(chainSeed, salt);
  let value = 0n;
  for (let i = 0; i < 6; i += 1) value = (value << 8n) | BigInt(digest[i]!);
  return Number(value) / 2 ** 48;
}

/**
 * Построение цепочки. Операция офлайновая и одноразовая: N = 10⁷ считается
 * за секунды и занимает ~320 МБ — хранить целиком, а не пересчитывать,
 * иначе доступ к звену i стоит N − i хэшей.
 */
export function buildChain(headSeed: string, length: number): string[] {
  const chain: string[] = new Array<string>(length + 1);
  chain[0] = headSeed;
  for (let i = 1; i <= length; i += 1) chain[i] = nextChainLink(chain[i - 1]!);
  return chain;
}
