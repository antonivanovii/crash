import {
  ERROR_CODES,
  IDEMPOTENCY_HEADER,
  type ApiErrorBody,
  type ErrorCode,
} from '@kobold/contracts';
import ky, { HTTPError, type KyInstance, type Options } from 'ky';

/**
 * HTTP-клиент на ky.
 *
 * Деньги ходят только по HTTP и только с ключом идемпотентности — по сокету
 * ставки не отправляются никогда: сокет умеет доставлять состояние, но не даёт
 * гарантии «ровно один раз», а ставка её требует.
 */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Ключ идемпотентности. Генерируется на клиенте один раз на операцию и
 * переживает ретраи: повтор с тем же ключом возвращает сохранённый ответ,
 * а не делает вторую ставку.
 *
 * Для составной операции (двадцать фишек на рулетке) ключ один на всю раскладку.
 */
export function newIdempotencyKey(): string {
  return crypto.randomUUID().replaceAll('-', '');
}

/** bigint не сериализуется в JSON — на провод он уходит строкой. */
function stringifyBigInts(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

export const api: KyInstance = ky.create({
  // ky сам нормализует слэши на стыке prefix и пути, поэтому вызовы
  // пишутся привычно: request('/games/limbo/bet').
  prefix: `${import.meta.env.VITE_API_URL ?? ''}/api/`,
  // Сессия — httpOnly-кука, поэтому credentials обязательны.
  credentials: 'include',
  timeout: 15_000,
  // Ретраями денежных запросов управляет вызывающий код: у мутации ретрай
  // обязан переиспользовать тот же ключ идемпотентности, а не начинать заново.
  retry: 0,
  hooks: {
    // Единственное место, где HTTP-ошибка превращается в доменную. Дальше по
    // коду разбирается `code`, а не текст и не статус.
    beforeError: [
      async ({ error }) => {
        if (!(error instanceof HTTPError)) return error;

        const body = (await error.response.json().catch(() => null)) as ApiErrorBody | null;
        return new ApiError(
          body?.code ?? ERROR_CODES.INTERNAL_ERROR,
          body?.message ?? 'Запрос не прошёл.',
          error.response.status,
          body?.details,
          body?.traceId,
        );
      },
    ],
  },
});

export interface RequestOptions extends Omit<Options, 'json' | 'method' | 'body'> {
  method?: 'get' | 'post' | 'patch' | 'delete';
  body?: unknown;
  idempotencyKey?: string;
}

/**
 * Тонкая обёртка над ky: проставляет заголовки идемпотентности и типа тела,
 * а тело сериализует с учётом bigint.
 */
export function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'get', body, idempotencyKey, headers, ...rest } = options;

  return api(path, {
    ...rest,
    method,
    headers: {
      ...headers,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(idempotencyKey ? { [IDEMPOTENCY_HEADER]: idempotencyKey } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body, stringifyBigInts) }),
  }).json<T>();
}

/**
 * Ретрай осмыслен только для сетевых сбоев и 5xx: отказ по балансу или лимиту
 * повторять бессмысленно, а «уже выполняется» — сигнал подождать, а не долбить
 * сервер.
 */
export function isRetryable(error: unknown): boolean {
  if (!isApiError(error)) return true;
  if (error.code === ERROR_CODES.IDEMPOTENCY_IN_PROGRESS) return true;
  return error.status >= 500;
}
