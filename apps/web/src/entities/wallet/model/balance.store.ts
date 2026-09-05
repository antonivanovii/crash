import type { BalanceUpdate } from '@kobold/contracts';
import { create } from 'zustand';

interface BalanceState {
  balances: Record<string, BalanceUpdate>;
  applyBalance: (update: BalanceUpdate) => void;
  applyAll: (updates: readonly BalanceUpdate[]) => void;
}

/**
 * Баланс приходит ТОЛЬКО по сокету и только из одного источника.
 *
 * Никаких вычислений баланса на клиенте: локальный счётчик допустим как
 * визуальная интерполяция (шары в полёте в Plinko), но при каждом серверном
 * обновлении он снапится к серверному значению.
 */
export const useBalanceStore = create<BalanceState>((set) => ({
  balances: {},

  applyBalance: (update) =>
    set((state) => {
      const known = state.balances[update.currency];
      // Сообщение из прошлого не должно откатывать баланс: пачки событий
      // приходят не в том порядке, в котором отправлялись.
      if (known && known.version > update.version) return state;
      return { balances: { ...state.balances, [update.currency]: update } };
    }),

  applyAll: (updates) => set({ balances: Object.fromEntries(updates.map((b) => [b.currency, b])) }),
}));
