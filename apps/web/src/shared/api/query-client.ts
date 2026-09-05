import { QueryClient } from '@tanstack/react-query';
import { isRetryable } from './client.js';

/**
 * React Query держит СЕРВЕРНОЕ состояние: каталог, история, настройки.
 *
 * Баланс и фаза раунда здесь не живут — они приходят по сокету и лежат
 * в сторах сущностей. Попытка держать баланс в React Query приводит к тому,
 * что после ставки он обновляется с задержкой или не обновляется вовсе.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (attempt, error) => attempt < 2 && isRetryable(error),
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Ретраем занимается вызывающий код: денежная мутация обязана повторяться
      // с тем же ключом идемпотентности.
      retry: false,
    },
  },
});
