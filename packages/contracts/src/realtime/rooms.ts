import type { GameSlug } from '@kobold/game-engine';

/**
 * Комнаты. Подписка по монтированию экрана: зашёл в crash — подписался,
 * вышел — отписался. Иначе клиент получает события всех игр сразу.
 */
export const ROOMS = {
  /** Личная комната: баланс, свои раунды, свои ставки. */
  user: (userId: string) => `user:${userId}`,
  /** Общий раунд конкретной игры. */
  game: (slug: GameSlug) => `game:${slug}`,
  /** Лёгкая сводка для лобби: один канал вместо семи подписок на комнаты игр. */
  lobby: () => 'lobby',
  /** Событие спортивной книги. */
  sportsEvent: (eventId: string) => `sports:event:${eventId}`,
  /** Рынок предсказаний. */
  market: (marketId: string) => `market:${marketId}`,
} as const;

export type RoomName = string;
