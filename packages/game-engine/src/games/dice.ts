import { multiplierFromDecimal, type Multiplier } from '@kobold/money';
import { DEFAULT_RTP } from '../constants.js';
import { uniform } from '../rng/bytes.js';
import type { BetOutcome, GameConfig } from './types.js';

/**
 * Dice — дискретная версия Limbo. Ролл: одно из 10000 равновероятных значений
 * 0.00 … 99.99, хранится целым в сотых (0 … 9999).
 *
 * Принципиально: ролл генерируется из сида НЕЗАВИСИМО от выбора игрока и только
 * потом сравнивается с таргетом. Бросать сразу монетку с вероятностью P было бы
 * математически эквивалентно, но проверяемость ломается — игрок не смог бы
 * убедиться, что при том же nonce и другом таргете ролл был бы тем же.
 */
export const DICE_OUTCOMES = 10_000;
export const DICE_MAX_ROLL = DICE_OUTCOMES - 1;

export const DICE_CONFIG: GameConfig = { rtp: DEFAULT_RTP, maxMultiplier: 9900 };

export type DiceDirection = 'UNDER' | 'OVER';

export interface DiceParams {
  /** Порог в сотых: 50.00 → 5000. */
  readonly target: number;
  readonly direction: DiceDirection;
}

export interface DiceResult {
  readonly u: number;
  /** Ролл в сотых: 4213 → 42.13. */
  readonly roll: number;
}

/** u → ролл в сотых. */
export function diceRoll(u: number): number {
  if (u < 0 || u >= 1) throw new RangeError(`u должен быть в [0,1), получено ${u}`);
  return Math.floor(u * DICE_OUTCOMES);
}

/**
 * Число выигрышных исходов из 10000.
 *  UNDER t: выигрывают 0.00 … t−0.01 → t исходов (в сотых)
 *  OVER  t: выигрывают строго больше t → 9999 − t исходов
 */
export function diceWinningOutcomes(params: DiceParams): number {
  return params.direction === 'UNDER' ? params.target : DICE_MAX_ROLL - params.target;
}

export function diceWinChance(params: DiceParams): number {
  return diceWinningOutcomes(params) / DICE_OUTCOMES;
}

export function diceMultiplier(params: DiceParams, config: GameConfig = DICE_CONFIG): Multiplier {
  const chance = diceWinChance(params);
  if (chance <= 0) throw new RangeError('Порог не оставляет выигрышных исходов');
  // Флор до сотых — в пользу дома, как и везде.
  return multiplierFromDecimal(Math.floor((config.rtp / chance) * 100) / 100);
}

export function isValidDiceTarget(params: DiceParams): boolean {
  if (!Number.isInteger(params.target)) return false;
  // Крайние пороги оставляют либо ноль исходов, либо нулевой эдж — обе стороны недопустимы.
  return params.direction === 'UNDER'
    ? params.target >= 1 && params.target <= 9899
    : params.target >= 100 && params.target <= DICE_MAX_ROLL - 1;
}

export function diceWins(roll: number, params: DiceParams): boolean {
  return params.direction === 'UNDER' ? roll < params.target : roll > params.target;
}

export function playDice(
  input: { serverSeed: string; clientSeed: string; nonce: number },
  params: DiceParams,
  config: GameConfig = DICE_CONFIG,
): BetOutcome<DiceResult> {
  const u = uniform(input.serverSeed, input.clientSeed, input.nonce);
  const roll = diceRoll(u);
  const won = diceWins(roll, params);
  return {
    result: { u, roll },
    multiplier: won ? diceMultiplier(params, config) : 0n,
    won,
  };
}
