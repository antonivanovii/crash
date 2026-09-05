import { queryClient } from '@/shared/api';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { RealtimeProvider } from './RealtimeProvider.js';

/**
 * Порядок провайдеров не случаен: сокет живёт над роутером, поэтому навигация
 * между играми не пересоздаёт соединение.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>{children}</RealtimeProvider>
    </QueryClientProvider>
  );
}
