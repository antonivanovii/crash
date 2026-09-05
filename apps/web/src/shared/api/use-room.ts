import { useEffect } from 'react';
import { realtimeClient } from './realtime.js';

/**
 * Подписка на комнату по монтированию экрана. Зашёл в crash — подписался,
 * вышел — отписался. Без этого клиент получает события всех игр сразу.
 */
export function useRoom(room: string | null): void {
  useEffect(() => {
    if (!room) return;
    return realtimeClient.join(room);
  }, [room]);
}
