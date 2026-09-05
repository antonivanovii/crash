import { z } from 'zod';
import { currencySchema, uuidSchema } from './common.js';

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  totp: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(10).max(128),
  currency: currencySchema.default('USD'),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const sessionUserSchema = z.object({
  id: uuidSchema,
  email: z.email(),
  displayName: z.string(),
  currency: currencySchema,
  twoFactorEnabled: z.boolean(),
  /** Игрок под самоисключением видит интерфейс, но не может ставить. */
  selfExcludedUntil: z.iso.datetime().nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const sessionResponseSchema = z.object({
  user: sessionUserSchema,
  /** Одноразовый билет для авторизации сокета: кука в WS-хендшейке ненадёжна. */
  socketTicket: z.string(),
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
