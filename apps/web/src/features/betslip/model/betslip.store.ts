import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PriceAcceptPolicy = 'ANY' | 'BETTER_ONLY' | 'NONE';

export interface BetslipLeg {
  readonly outcomeId: string;
  readonly eventId: string;
  readonly label: string;
  /** Цена в сотых и её версия: сервер отвергает плечо с устаревшей версией. */
  readonly price: number;
  readonly priceVersion: number;
  readonly suspended: boolean;
}

interface BetslipState {
  legs: BetslipLeg[];
  stake: string;
  policy: PriceAcceptPolicy;
  add: (leg: BetslipLeg) => void;
  remove: (outcomeId: string) => void;
  clear: () => void;
  setStake: (stake: string) => void;
  setPolicy: (policy: PriceAcceptPolicy) => void;
}

/**
 * Купон — не страница, а персистентный слой поверх любого маршрута.
 *
 * Он переживает навигацию и перезагрузку. Перезагрузка при этом обязана
 * заканчиваться перепроверкой цен: сохранённая цена — снимок прошлого,
 * и принимать по ней ставку нельзя.
 */
export const useBetslipStore = create<BetslipState>()(
  persist(
    (set) => ({
      legs: [],
      stake: '',
      policy: 'BETTER_ONLY',

      add: (leg) =>
        set((state) =>
          state.legs.some((l) => l.outcomeId === leg.outcomeId)
            ? state
            : { legs: [...state.legs, leg] },
        ),
      remove: (outcomeId) =>
        set((state) => ({ legs: state.legs.filter((l) => l.outcomeId !== outcomeId) })),
      clear: () => set({ legs: [], stake: '' }),
      setStake: (stake) => set({ stake }),
      setPolicy: (policy) => set({ policy }),
    }),
    {
      name: 'kobold:betslip',
      // Сумма не восстанавливается: «готовый к отправке» купон после
      // перезагрузки, с ценами из прошлого, — ловушка.
      partialize: (state) => ({ legs: state.legs, policy: state.policy }),
    },
  ),
);
