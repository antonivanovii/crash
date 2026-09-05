import { multiplierFromDecimal, multiplierToDecimal, type Multiplier } from '@kobold/money';
import { CRASH_GROWTH_RATE, DEFAULT_MAX_MULTIPLIER, DEFAULT_RTP } from '../constants.js';
import { chainUniform } from '../fairness/chain.js';
import type { GameConfig } from './types.js';

/**
 * Crash — тот же Limbo, только раунд общий.
 *
 *   C = max(1.00, floor(100 · RTP/(1−r)) / 100)
 *
 * P(C ≥ m) = RTP/m, значит автокэшаут на любом m даёт ровно RTP. Стратегии нет.
 *
 * Отличие от Limbo: кап ограничивает не только выплату, но и ДЛИТЕЛЬНОСТЬ раунда.
 * При M(t) = e^(k·t) время до капа — ln(C_max)/k.
 */
export const CRASH_CONFIG: GameConfig = {
  rtp: DEFAULT_RTP,
  // 10 000× при удвоении за 5 секунд — это ~66 секунд раунда. Миллион здесь неигрибелен.
  maxMultiplier: 10_000,
};

export function crashPoint(
  chainSeed: string,
  salt: string,
  config: GameConfig = CRASH_CONFIG,
): Multiplier {
  const r = chainUniform(chainSeed, salt);
  return crashPointFromUniform(r, config);
}

export function crashPointFromUniform(r: number, config: GameConfig = CRASH_CONFIG): Multiplier {
  if (r < 0 || r >= 1) throw new RangeError(`r должен быть в [0,1), получено ${r}`);

  // r → 1 даёт деление на около-ноль; кап срабатывает раньше, чем это станет проблемой.
  const raw = 1 - r === 0 ? config.maxMultiplier : config.rtp / (1 - r);
  const floored = Math.floor(raw * 100) / 100;
  return multiplierFromDecimal(Math.min(Math.max(floored, 1), config.maxMultiplier));
}

/**
 * Множитель как функция времени. Клиент считает его сам — сервер шлёт только
 * старт, кэшауты и крах. Трансляция множителя 60 раз в секунду каждому
 * подключённому — самая частая ошибка масштабирования crash.
 */
export function multiplierAt(elapsedMs: number, growthRate = CRASH_GROWTH_RATE): number {
  if (elapsedMs <= 0) return 1;
  return Math.exp((growthRate * elapsedMs) / 1000);
}

/**
 * Момент краха относительно старта. Пишется в БД ДО перехода в RUNNING:
 * упавший лидер должен уметь доиграть раунд, иначе падение оркестратора
 * превращается в способ отменить неудобный раунд.
 */
export function crashTimeMs(point: Multiplier, growthRate = CRASH_GROWTH_RATE): number {
  return (Math.log(multiplierToDecimal(point)) / growthRate) * 1000;
}

/**
 * Кэшаут валиден тогда и только тогда, когда серверное время приёма меньше T_crash.
 * Заявленный клиентом множитель не участвует — вообще.
 */
export function isCashoutValid(
  startedAtMs: number,
  receivedAtMs: number,
  point: Multiplier,
): boolean {
  return receivedAtMs - startedAtMs < crashTimeMs(point);
}

/** Множитель, зафиксированный на момент приёма кэшаута сервером. */
export function cashoutMultiplier(startedAtMs: number, receivedAtMs: number): Multiplier {
  const raw = multiplierAt(receivedAtMs - startedAtMs);
  return multiplierFromDecimal(Math.max(1, Math.floor(raw * 100) / 100));
}

export const CRASH_MAX_MULTIPLIER = DEFAULT_MAX_MULTIPLIER;
