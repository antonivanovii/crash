import { LIMBO_CONFIG, LIMBO_MIN_TARGET, limboMaxTarget } from '@kobold/game-engine';
import { z } from 'zod';
import { betBaseSchema } from '../bets.js';
import { multiplierSchema } from '../common.js';

/**
 * Границы таргета берутся из движка, а не дублируются числом. Правка кап-множителя
 * в одном месте автоматически меняет и валидацию.
 */
export const limboBetRequestSchema = betBaseSchema.extend({
  target: multiplierSchema.refine(
    (v) => v >= LIMBO_MIN_TARGET && v <= limboMaxTarget(LIMBO_CONFIG),
    `Таргет вне диапазона 1.01 … ${LIMBO_CONFIG.maxMultiplier}`,
  ),
});
export type LimboBetRequest = z.infer<typeof limboBetRequestSchema>;

export const limboResultSchema = z.object({
  u: z.number().min(0).lt(1),
  multiplier: multiplierSchema,
});
