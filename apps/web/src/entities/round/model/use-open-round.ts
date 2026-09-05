import { newIdempotencyKey, request } from '@/shared/api';
import type { GameSlug } from '@kobold/game-engine';
import { useCallback, useRef } from 'react';
import { useRoundStore } from './round.store.js';

/**
 * Примитив второй: открытый раунд. Mines, Towers, фриспины.
 *
 * Состояние живёт на сервере, клиент делает несколько запросов и обязан уметь
 * восстановиться после реконнекта. Восстановление приходит снапшотом по сокету,
 * а не собирается из локальной истории: игрок мог бросить раунд на четвёртом
 * шаге и вернуться через день.
 *
 * Гонка «открыть тайл» против «забрать» решается на сервере одной транзакцией
 * с блокировкой раунда — клиент лишь не создаёт её без нужды.
 */
export function useOpenRound<TAction>(game: GameSlug) {
  const round = useRoundStore((s) => s.openRounds[game] ?? null);
  const inFlight = useRef(false);

  const call = useCallback(
    async <TState>(path: string, body: unknown): Promise<TState> => {
      if (inFlight.current) throw new Error('Предыдущее действие ещё выполняется');
      inFlight.current = true;
      try {
        return await request<TState>(`/games/${game}${path}`, {
          method: 'post',
          body,
          idempotencyKey: newIdempotencyKey(),
        });
      } finally {
        inFlight.current = false;
      }
    },
    [game],
  );

  return {
    start: (params: unknown) => call('/start', params),
    act: (action: TAction) => call('/act', action),
    cashout: () => call('/cashout', {}),
    round,
    hasActiveRound: round !== null,
  };
}
