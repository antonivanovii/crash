import { isValidDiceTarget } from '@kobold/game-engine';
import { z } from 'zod';
import { betBaseSchema } from '../bets.js';

export const diceDirectionSchema = z.enum(['UNDER', 'OVER']);

export const diceBetRequestSchema = betBaseSchema
  .extend({
    /** Порог в сотых: 50.00 → 5000. Целое, дроби отвергаются. */
    target: z.number().int().min(0).max(9999),
    direction: diceDirectionSchema,
  })
  .refine((v) => isValidDiceTarget({ target: v.target, direction: v.direction }), {
    message: 'Порог не оставляет корректного диапазона исходов',
    path: ['target'],
  });
export type DiceBetRequest = z.infer<typeof diceBetRequestSchema>;

export const diceResultSchema = z.object({
  u: z.number().min(0).lt(1),
  roll: z.number().int().min(0).max(9999),
});
