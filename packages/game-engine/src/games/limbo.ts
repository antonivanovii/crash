import { multiplierFromDecimal, type Multiplier } from '@kobold/money';
import { DEFAULT_MAX_MULTIPLIER, DEFAULT_RTP, MIN_TARGET_MULTIPLIER } from '../constants.js';
import { uniform } from '../rng/bytes.js';
import type { BetOutcome, GameConfig } from './types.js';

/**
 * Limbo.
 *
 * Нужна величина M с P(M ≥ m) = RTP/m при любом m — тогда матожидание игрока
 * равно RTP при любой стратегии. Берётся в одну строку: M = RTP/u при u ~ U[0,1).
 *
 *   P(M ≥ m) = P(RTP/u ≥ m) = P(u ≤ RTP/m) = RTP/m
 *
 * Округление до сотых — вниз: целевые множители тоже двухзначные, поэтому
 * M ≥ m ⟺ raw ≥ m, перекоса не возникает.
 *
 * Кап ограничивает ЗНАЧЕНИЕ (min(raw, MAX)), а не отбрасывает раунд. Реролл
 * сломал бы распределение.
 */
export function limboMultiplier(u: number, config: GameConfig = LIMBO_CONFIG): Multiplier {
  if (u < 0 || u >= 1) throw new RangeError(`u должен быть в [0,1), получено ${u}`);

  const raw = u === 0 ? config.maxMultiplier : config.rtp / u;
  const floored = Math.floor(raw * 100) / 100;
  const clamped = Math.min(Math.max(floored, 1), config.maxMultiplier);
  return multiplierFromDecimal(clamped);
}

export const LIMBO_CONFIG: GameConfig = {
  rtp: DEFAULT_RTP,
  maxMultiplier: DEFAULT_MAX_MULTIPLIER,
};

export interface LimboParams {
  /** Целевой множитель в сотых: 2.00x → 200n. */
  readonly target: Multiplier;
}

export interface LimboResult {
  readonly u: number;
  readonly multiplier: Multiplier;
}

export const LIMBO_MIN_TARGET = multiplierFromDecimal(MIN_TARGET_MULTIPLIER);

export function limboMaxTarget(config: GameConfig = LIMBO_CONFIG): Multiplier {
  return multiplierFromDecimal(config.maxMultiplier);
}

export function isValidLimboTarget(target: Multiplier, config: GameConfig = LIMBO_CONFIG): boolean {
  return target >= LIMBO_MIN_TARGET && target <= limboMaxTarget(config);
}

/** Шанс выигрыша при данном таргете — для интерфейса, деньги на этом не считаются. */
export function limboWinChance(target: Multiplier, config: GameConfig = LIMBO_CONFIG): number {
  return config.rtp / (Number(target) / 100);
}

export function playLimbo(
  input: { serverSeed: string; clientSeed: string; nonce: number },
  params: LimboParams,
  config: GameConfig = LIMBO_CONFIG,
): BetOutcome<LimboResult> {
  const u = uniform(input.serverSeed, input.clientSeed, input.nonce);
  const multiplier = limboMultiplier(u, config);
  const won = multiplier >= params.target;

  // Выплата считается по ТАРГЕТУ, а не по выпавшему множителю: игрок покупает
  // фиксированный коэффициент, а не то, насколько сильно он перепрыгнул цель.
  return { result: { u, multiplier }, multiplier: won ? params.target : 0n, won };
}
