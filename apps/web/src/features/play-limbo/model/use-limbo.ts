import { useAtomicBet } from '@/entities/round';
import { toMinorUnits } from '@/shared/lib';
import { limboWinChance } from '@kobold/game-engine';
import { multiplierFromDecimal } from '@kobold/money';
import { useMemo, useState } from 'react';

export interface LimboResult {
  u: number;
  multiplier: string;
}

/**
 * Состояние экрана Limbo поверх общего примитива.
 *
 * Игрового здесь ничего нет: ввод, валидация до отправки, вызов рантайма.
 * Вся математика — в @kobold/game-engine, и это та же функция, которой считает
 * сервер и которой пересчитывает верификатор.
 */
export function useLimbo(currency: string) {
  const [stake, setStake] = useState('1.00');
  const [target, setTarget] = useState('2.00');

  const bet = useAtomicBet<{ currency: string; stake: string; target: string }, LimboResult>(
    'limbo',
  );

  const targetMultiplier = useMemo(() => {
    try {
      return multiplierFromDecimal(Number(target));
    } catch {
      return null;
    }
  }, [target]);

  const valid = targetMultiplier !== null && targetMultiplier >= 101n;
  const winChance = valid && targetMultiplier ? limboWinChance(targetMultiplier) : null;

  return {
    stake,
    setStake,
    target,
    setTarget,
    targetMultiplier,
    winChance,
    valid,
    ...bet,
    play: () => {
      if (!valid || !targetMultiplier) return;
      bet.play({ currency, stake: toMinorUnits(stake), target: targetMultiplier.toString() });
    },
  };
}
