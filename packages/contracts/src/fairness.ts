import { z } from 'zod';
import { uuidSchema } from './common.js';

export const seedPairSchema = z.object({
  id: uuidSchema,
  /** Публикуется сразу; сам серверный сид — только после ротации. */
  serverSeedHash: z.string().regex(/^[0-9a-f]{64}$/),
  serverSeed: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .nullable(),
  clientSeed: z.string().min(1).max(64),
  nonce: z.number().int().nonnegative(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  revealedAt: z.iso.datetime().nullable(),
});
export type SeedPair = z.infer<typeof seedPairSchema>;

/**
 * Смена клиентского сида форсирует ротацию серверного. Иначе игрок, зная
 * поведение при разных клиентских сидах, подбирает выгодный.
 */
export const rotateSeedRequestSchema = z.object({
  clientSeed: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[\x20-\x7e]+$/, 'Только печатаемые ASCII-символы')
    .optional(),
});

export const rotateSeedResponseSchema = z.object({
  /** Раскрывается всегда и автоматически — иначе коммитмент бессмыслен. */
  revealed: seedPairSchema,
  current: seedPairSchema,
});

export const verifyRequestSchema = z.object({
  game: z.string(),
  serverSeed: z.string().min(1),
  clientSeed: z.string().min(1),
  nonce: z.number().int().nonnegative(),
  params: z.record(z.string(), z.unknown()).default({}),
});

export const chainInfoSchema = z.object({
  game: z.string(),
  /** Публичная соль, зафиксированная ДО генерации цепочки. Без неё цепочка декоративна. */
  salt: z.string(),
  headHash: z.string().regex(/^[0-9a-f]{64}$/),
  length: z.number().int().positive(),
  cursor: z.number().int().nonnegative(),
});
export type ChainInfo = z.infer<typeof chainInfoSchema>;
