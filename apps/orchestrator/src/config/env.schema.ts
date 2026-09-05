import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),

  REDIS_URL: z.string().min(1),
  REDIS_DB_PUBSUB: z.coerce.number().int().min(0).default(0),
  REDIS_DB_LOCKS: z.coerce.number().int().min(0).default(1),

  /**
   * TTL блокировки лидера и период её продления. TTL должен с запасом
   * переживать паузу GC и сетевой всплеск, иначе лидерство «мигает»;
   * период продления — заметно меньше TTL, иначе лидер теряет блокировку,
   * которую формально ещё держит.
   */
  LEADER_LOCK_TTL_MS: z.coerce.number().int().min(1000).default(10_000),
  LEADER_RENEW_INTERVAL_MS: z.coerce.number().int().min(250).default(3_000),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Локальная разработка читает .env из корня монорепы; в проде переменные
 * приходят из окружения, и файла просто нет. Node 24 умеет это сам, без
 * dotenv в зависимостях.
 */
function loadDotenv(): void {
  const root = fileURLToPath(new URL('../../../../.env', import.meta.url));
  try {
    process.loadEnvFile(root);
  } catch {
    // Файла нет — это нормальный случай для продакшена.
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  loadDotenv();

  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Некорректная конфигурация окружения:\n${parsed.error.issues
        .map((i) => `  ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    );
  }
  const env = parsed.data;
  if (env.LEADER_RENEW_INTERVAL_MS >= env.LEADER_LOCK_TTL_MS / 2) {
    throw new Error('LEADER_RENEW_INTERVAL_MS должен быть меньше половины LEADER_LOCK_TTL_MS');
  }
  return env;
}
