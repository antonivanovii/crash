import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/**
 * Переменные окружения валидируются на старте и падают громко.
 *
 * Приложение, поднявшееся с половиной конфига, — это приложение, которое
 * сломается на первой денежной операции, а не при запуске.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(200).default(20),

  REDIS_URL: z.string().min(1),
  REDIS_DB_PUBSUB: z.coerce.number().int().min(0).default(0),
  REDIS_DB_LOCKS: z.coerce.number().int().min(0).default(1),
  REDIS_DB_CACHE: z.coerce.number().int().min(0).default(2),

  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Секрет короче 32 символов — это не секрет. Проверяется здесь, а не в ревью.
  SESSION_SECRET: z.string().min(32),
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
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join('.') || '(корень)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Некорректная конфигурация окружения:\n${issues}`);
  }
  return parsed.data;
}
