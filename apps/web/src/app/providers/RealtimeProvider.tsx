import { useRoundStore } from '@/entities/round';
import { useSessionStore } from '@/entities/session';
import { useBalanceStore } from '@/entities/wallet';
import { realtimeClient } from '@/shared/api';
import { useEffect, type ReactNode } from 'react';

/**
 * Провайдер живёт НАД роутером: навигация между играми не должна пересоздавать
 * соединение.
 *
 * Здесь же события транспорта раскладываются по сторам сущностей. Это работа
 * слоя app: транспорт в shared не имеет права знать про сущности, а сущности
 * не должны знать про сокет.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const userId = useSessionStore((s) => s.user?.id ?? null);
  const ticket = useSessionStore((s) => s.socketTicket);

  useEffect(() => {
    const offSnapshot = realtimeClient.on('snapshot', (snapshot) => {
      useBalanceStore.getState().applyAll(snapshot.balances);
      useRoundStore.getState().applyAll({
        openRounds: snapshot.openRounds,
        sharedRounds: snapshot.sharedRounds,
      });
    });
    const offBalance = realtimeClient.on('balance', (update) =>
      useBalanceStore.getState().applyBalance(update),
    );
    const offOpenRound = realtimeClient.on('open-round', (round) =>
      useRoundStore.getState().applyOpenRound(round),
    );
    const offSharedRound = realtimeClient.on('round:started', (round) =>
      useRoundStore.getState().applySharedRound(round),
    );

    return () => {
      offSnapshot();
      offBalance();
      offOpenRound();
      offSharedRound();
    };
  }, []);

  useEffect(() => {
    if (!userId || !ticket) return;
    realtimeClient.connect(ticket);
    return () => realtimeClient.disconnect();
  }, [userId, ticket]);

  return children;
}
