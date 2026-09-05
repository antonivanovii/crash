import { ApiError, newIdempotencyKey, request } from '@/shared/api';
import type { GameSlug } from '@kobold/game-engine';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

/**
 * Примитив первый: атомарная ставка. Limbo, Dice, Plinko, Wheel, Keno.
 *
 * Хук берёт на себя всё, что одинаково у всех таких игр: генерацию ключа
 * идемпотентности и его переиспользование при ретрае, оптимистичное состояние
 * кнопки, обработку отказов по балансу и лимиту. Игра получает только
 * `(result) => отрисовка`.
 */
export interface AtomicBetResponse<TResult> {
  id: string;
  game: GameSlug;
  stake: string;
  payout: string;
  multiplier: string;
  won: boolean;
  currency: string;
  nonce: number;
  serverSeedHash: string;
  clientSeed: string;
  result: TResult;
  balanceAfter: string;
  createdAt: string;
}

export interface UseAtomicBetOptions<TResult> {
  onResult?: (result: AtomicBetResponse<TResult>) => void;
  historyLimit?: number;
}

export function useAtomicBet<TParams extends object, TResult>(
  game: GameSlug,
  options: UseAtomicBetOptions<TResult> = {},
) {
  const [lastResult, setLastResult] = useState<AtomicBetResponse<TResult> | null>(null);
  const [history, setHistory] = useState<AtomicBetResponse<TResult>[]>([]);

  /**
   * Ключ живёт между попытками ОДНОЙ ставки. Новый ключ на ретрае — это вторая
   * ставка, а не повтор первой; ровно так теряются деньги на плохой сети.
   */
  const pendingKey = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: TParams) => {
      pendingKey.current ??= newIdempotencyKey();
      return request<AtomicBetResponse<TResult>>(`/games/${game}/bet`, {
        method: 'post',
        body: params,
        idempotencyKey: pendingKey.current,
      });
    },
    onSuccess: (result) => {
      pendingKey.current = null;
      setLastResult(result);
      // Лента истории даёт непрерывность: видно серию, видно, что игра живая.
      setHistory((prev) => [result, ...prev].slice(0, options.historyLimit ?? 30));
      options.onResult?.(result);
    },
    onError: (error) => {
      // Отказ по балансу или лимиту окончателен — ключ отпускаем.
      // Сетевой сбой не окончателен: тот же ключ должен уехать повторно.
      if (error instanceof ApiError && error.status < 500) pendingKey.current = null;
    },
  });

  const play = useCallback((params: TParams) => mutation.mutate(params), [mutation]);

  return {
    play,
    playAsync: mutation.mutateAsync,
    /** Кнопка уходит в disabled по клику, а не по ответу: отклик даёт ощущение скорости. */
    isPending: mutation.isPending,
    error: mutation.error,
    lastResult,
    history,
    reset: () => {
      setLastResult(null);
      setHistory([]);
    },
  };
}
