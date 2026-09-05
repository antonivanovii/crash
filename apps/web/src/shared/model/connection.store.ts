import type { ConnectionNotice } from '@kobold/contracts';
import { create } from 'zustand';

export type ConnectionState = 'online' | 'connecting' | 'offline';

interface ConnectionStoreState {
  connection: ConnectionState;
  /**
   * Смещение серверных часов относительно локальных, мс.
   *
   * Нужно для crash и таймеров фаз: множитель клиент считает сам от startedAt,
   * и без поправки кривая уезжает ровно на величину расхождения часов.
   */
  clockOffset: number;
  notice: ConnectionNotice | null;

  setConnection: (state: ConnectionState) => void;
  setClockOffset: (offset: number) => void;
  setNotice: (notice: ConnectionNotice | null) => void;
}

/**
 * Состояние транспорта. Живёт в shared, потому что не несёт бизнес-смысла:
 * связь и часы одинаково нужны и кошельку, и раунду, и купону.
 */
export const useConnectionStore = create<ConnectionStoreState>((set) => ({
  connection: 'connecting',
  clockOffset: 0,
  notice: null,

  setConnection: (connection) => set({ connection }),
  setClockOffset: (clockOffset) => set({ clockOffset }),
  setNotice: (notice) => set({ notice }),
}));

/** Серверное «сейчас». От него игры считают кривые и таймеры фаз. */
export function serverNow(): number {
  return Date.now() + useConnectionStore.getState().clockOffset;
}
