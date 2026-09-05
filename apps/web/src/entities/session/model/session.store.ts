import { create } from 'zustand';

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly currency: string;
}

interface SessionState {
  user: SessionUser | null;
  status: 'unknown' | 'authenticated' | 'anonymous';
  /** Одноразовый билет для авторизации сокета: кука в WS-хендшейке ненадёжна. */
  socketTicket: string | null;
  setSession: (user: SessionUser | null, socketTicket?: string | null) => void;
}

/**
 * Сессия отдельно от React Query: от неё зависит, поднимать ли сокет вообще,
 * и это решение принимается до первого запроса за данными.
 */
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: 'unknown',
  socketTicket: null,
  setSession: (user, socketTicket = null) =>
    set({ user, socketTicket, status: user ? 'authenticated' : 'anonymous' }),
}));
