import { newIdempotencyKey, realtimeClient, request, useRoom } from '@/shared/api';
import { serverNow } from '@/shared/model';
import { ROOMS, type SharedRoundCashout, type SharedRoundEnded } from '@kobold/contracts';
import type { GameSlug } from '@kobold/game-engine';
import { useEffect, useState } from 'react';
import { useRoundStore } from './round.store.js';

/**
 * Примитив третий: общий раунд. Crash, рулетка, Dragon Tiger, общий тираж.
 *
 * Ключевое отличие от двух других: состояние приходит событиями оркестратора,
 * а НЕ ответом на запрос. Множитель сервер не транслирует — клиент считает его
 * сам от startedAt с поправкой на смещение часов.
 *
 * Ставка при этом всё равно уходит по HTTP с ключом идемпотентности.
 */
export function useSharedRound(game: GameSlug) {
  useRoom(ROOMS.game(game));

  const round = useRoundStore((s) => s.sharedRounds[game] ?? null);
  const [cashouts, setCashouts] = useState<SharedRoundCashout[]>([]);
  const [lastEnded, setLastEnded] = useState<SharedRoundEnded | null>(null);

  useEffect(() => {
    // Пачка разворачивается в ОДНО обновление состояния, а не в двадцать.
    const offCashouts = realtimeClient.on('round:cashouts', (batch) => {
      if (batch.game !== game) return;
      setCashouts((prev) => [...batch.cashouts, ...prev].slice(0, 100));
    });

    const offEnded = realtimeClient.on('round:ended', (event) => {
      if (event.game !== game) return;
      setLastEnded(event);
      setCashouts([]);
    });

    return () => {
      offCashouts();
      offEnded();
    };
  }, [game]);

  return {
    phase: round?.phase ?? 'IDLE',
    roundId: round?.roundId ?? null,
    startedAt: round?.startedAt ?? null,
    closesAt: round?.closesAt ?? null,
    seedHash: round?.seedHash ?? null,
    cashouts,
    lastEnded,
    /** Серверное «сейчас» — от него игра считает кривую и таймеры фаз. */
    now: serverNow,
    bet: (params: unknown) =>
      request(`/games/${game}/bet`, {
        method: 'post',
        body: params,
        idempotencyKey: newIdempotencyKey(),
      }),
  };
}
