import type { Multiplier } from '@kobold/money';

/**
 * Три примитива, из которых складываются все игры. Из них же выводятся
 * три хука на фронте и три формы оркестрации на бэке.
 */
export type GameKind =
  /** Запрос → ответ → отрисовка. Limbo, Dice, Plinko, Wheel, Keno. */
  | 'ATOMIC'
  /** Состояние на сервере, несколько запросов, восстановление при реконнекте. Mines, Towers. */
  | 'OPEN_ROUND'
  /** Оркестратор, фазы, pub/sub. Crash, рулетка, Dragon Tiger, Sic-Bo. */
  | 'SHARED_ROUND';

export interface GameConfig {
  readonly rtp: number;
  readonly maxMultiplier: number;
}

/**
 * Результат розыгрыша. Всё, чего хватает, чтобы через год воспроизвести раунд
 * из строки в БД: входы игрока, сырой розыгрыш и вычисленный исход.
 */
export interface BetOutcome<TResult> {
  readonly result: TResult;
  readonly multiplier: Multiplier;
  readonly won: boolean;
}
