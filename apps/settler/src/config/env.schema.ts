import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
  REDIS_URL: z.string().min(1),
  SETTLER_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(4),
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
  return parsed.data;
}
