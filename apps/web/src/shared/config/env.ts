/**
 * Точка доступа к переменным сборки. Прямые обращения к import.meta.env
 * по коду разъезжаются при первом же переименовании.
 */
export const CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  wsUrl: import.meta.env.VITE_WS_URL ?? '',
  isDev: import.meta.env.DEV,
} as const;
