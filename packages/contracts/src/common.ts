import { CURRENCY_CODES } from '@kobold/money';
import { z } from 'zod';

/**
 * Общие примитивы границы API.
 *
 * Деньги на проводе — всегда строка целого числа минорных единиц. JSON не умеет
 * bigint, а number теряет точность на больших суммах: 9007199254740993 приходит
 * как 9007199254740992, и это не заметно, пока не станет поздно.
 */
export const uuidSchema = z.uuid();

export const currencySchema = z.enum(CURRENCY_CODES as [string, ...string[]]);

/** Сумма в минорных единицах, неотрицательная. */
export const amountSchema = z
  .string()
  .regex(/^\d{1,38}$/, 'Сумма — целое число минорных единиц в виде строки')
  .transform((v) => BigInt(v));

/** Сумма со знаком — для проводок леджера. */
export const signedAmountSchema = z
  .string()
  .regex(/^-?\d{1,38}$/)
  .transform((v) => BigInt(v));

/** Строго положительная ставка. */
export const stakeSchema = amountSchema.refine((v) => v > 0n, 'Ставка должна быть положительной');

/** Множитель в сотых: «198» → 198n → 1.98x. */
export const multiplierSchema = z
  .string()
  .regex(/^\d{1,18}$/)
  .transform((v) => BigInt(v));

/**
 * Ключ идемпотентности. Приходит от клиента в заголовке, хранится в transactions
 * с уникальным индексом. Для составной операции (двадцать фишек на рулетке) —
 * один ключ на всю раскладку.
 */
export const IDEMPOTENCY_HEADER = 'idempotency-key';

export const idempotencyKeySchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, 'Ключ идемпотентности — url-safe строка');

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().max(256).optional(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function pageOf<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

/** ISO-8601 с миллисекундами. Времена всегда UTC и всегда от сервера. */
export const timestampSchema = z.iso.datetime();
