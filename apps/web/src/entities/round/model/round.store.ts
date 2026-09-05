import type { OpenRoundState, SharedRoundStarted } from '@kobold/contracts';
import { create } from 'zustand';

interface RoundState {
  /** Брошенные открытые раунды: из них строится секция «продолжить» и модалка восстановления. */
  openRounds: Record<string, OpenRoundState>;
  sharedRounds: Record<string, SharedRoundStarted>;

  applyOpenRound: (round: OpenRoundState) => void;
  clearOpenRound: (game: string) => void;
  applySharedRound: (round: SharedRoundStarted) => void;
  applyAll: (input: {
    openRounds: readonly OpenRoundState[];
    sharedRounds: readonly SharedRoundStarted[];
  }) => void;
}

export const useRoundStore = create<RoundState>((set) => ({
  openRounds: {},
  sharedRounds: {},

  applyOpenRound: (round) =>
    set((state) => ({ openRounds: { ...state.openRounds, [round.game]: round } })),

  clearOpenRound: (game) =>
    set((state) => {
      const { [game]: _removed, ...rest } = state.openRounds;
      return { openRounds: rest };
    }),

  applySharedRound: (round) =>
    set((state) => ({ sharedRounds: { ...state.sharedRounds, [round.game]: round } })),

  applyAll: ({ openRounds, sharedRounds }) =>
    set({
      openRounds: Object.fromEntries(openRounds.map((r) => [r.game, r])),
      sharedRounds: Object.fromEntries(sharedRounds.map((r) => [r.game, r])),
    }),
}));
