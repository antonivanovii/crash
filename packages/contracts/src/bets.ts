import { GAME_SLUGS } from '@kobold/game-engine';
import { z } from 'zod';
import {
  amountSchema,
  currencySchema,
  multiplierSchema,
  pageOf,
  paginationSchema,
  stakeSchema,
  uuidSchema,
} from './common.js';

export const gameSlugSchema = z.enum(GAME_SLUGS);

/** Общая часть любой ставки. Конкретные параметры игры приезжают отдельной схемой. */
export const betBaseSchema = z.object({
  currency: currencySchema,
  stake: stakeSchema,
});

/**
 * Ответ на ставку. Кладём и входы, и результат: клиент отрисовывает исход, а
 * верификатор пересчитывает его тем же кодом из game-engine.
 */
export const betResultSchema = z.object({
  id: uuidSchema,
  game: gameSlugSchema,
  stake: amountSchema,
  payout: amountSchema,
  multiplier: multiplierSchema,
  won: z.boolean(),
  currency: currencySchema,
  nonce: z.number().int().nonnegative(),
  serverSeedHash: z.string(),
  clientSeed: z.string(),
  params: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()),
  balanceAfter: amountSchema,
  createdAt: z.iso.datetime(),
});
export type BetResult = z.infer<typeof betResultSchema>;

export const betHistoryQuerySchema = paginationSchema.extend({
  game: gameSlugSchema.optional(),
});

export const betHistoryPageSchema = pageOf(betResultSchema);
