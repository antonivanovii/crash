import { z } from 'zod';
import {
  amountSchema,
  currencySchema,
  pageOf,
  paginationSchema,
  signedAmountSchema,
  uuidSchema,
} from './common.js';

/**
 * Типы проводок. Расширяется только добавлением: исторические строки в леджере
 * ссылаются на тип, и переименование ломает всю отчётность задним числом.
 */
export const ENTRY_TYPES = [
  'DEPOSIT',
  'WITHDRAWAL',
  'BET',
  'PAYOUT',
  'REFUND',
  'ESCROW_LOCK',
  'ESCROW_RELEASE',
  'FEE',
  'BONUS',
  'ADJUSTMENT',
] as const;

export const entryTypeSchema = z.enum(ENTRY_TYPES);
export type EntryType = z.infer<typeof entryTypeSchema>;

export const balanceSchema = z.object({
  currency: currencySchema,
  /** Свободные средства — то, чем можно ставить прямо сейчас. */
  available: amountSchema,
  /** В эскроу активных раундов, спортивных ставок и позиций. */
  locked: amountSchema,
  total: amountSchema,
});
export type Balance = z.infer<typeof balanceSchema>;

/**
 * Строка выписки. Обязательно с балансом ПОСЛЕ операции и ссылкой на источник —
 * это то, что предъявляется при споре.
 */
export const ledgerEntrySchema = z.object({
  id: uuidSchema,
  transactionId: uuidSchema,
  type: entryTypeSchema,
  amount: signedAmountSchema,
  balanceAfter: amountSchema,
  currency: currencySchema,
  createdAt: z.iso.datetime(),
  reference: z
    .object({
      kind: z.enum(['BET', 'ROUND', 'SPORT_BET', 'TRADE', 'DEPOSIT', 'WITHDRAWAL']),
      id: uuidSchema,
    })
    .nullable(),
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

export const ledgerQuerySchema = paginationSchema.extend({
  type: entryTypeSchema.optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

export const ledgerPageSchema = pageOf(ledgerEntrySchema);

export const depositRequestSchema = z.object({
  currency: currencySchema,
  amount: amountSchema.refine((v) => v > 0n, 'Сумма должна быть положительной'),
});

export const withdrawRequestSchema = z.object({
  currency: currencySchema,
  amount: amountSchema.refine((v) => v > 0n, 'Сумма должна быть положительной'),
  destination: z.string().min(1).max(256),
});
