import type { GameKind } from './types.js';

/**
 * Реестр игр. Один источник слагов для маршрута /casino/:gameSlug, для комнат
 * сокета и для колонки `game` в bets — расхождение между ними стоит дороже,
 * чем небольшая связанность.
 */
export interface GameDefinition {
  readonly slug: GameSlug;
  readonly title: string;
  readonly kind: GameKind;
  /** Реализована ли игра. Реестр опережает код — так виден план и не плодятся строковые литералы. */
  readonly available: boolean;
}

export const GAME_SLUGS = [
  'limbo',
  'dice',
  'mines',
  'towers',
  'plinko',
  'wheel',
  'keno',
  'crash',
  'roulette',
  'dragon-tiger',
  'sic-bo',
] as const;

export type GameSlug = (typeof GAME_SLUGS)[number];

export const GAMES: Record<GameSlug, GameDefinition> = {
  limbo: { slug: 'limbo', title: 'Limbo', kind: 'ATOMIC', available: true },
  dice: { slug: 'dice', title: 'Dice', kind: 'ATOMIC', available: true },
  plinko: { slug: 'plinko', title: 'Plinko', kind: 'ATOMIC', available: false },
  wheel: { slug: 'wheel', title: 'Wheel', kind: 'ATOMIC', available: false },
  keno: { slug: 'keno', title: 'Keno', kind: 'ATOMIC', available: false },
  mines: { slug: 'mines', title: 'Mines', kind: 'OPEN_ROUND', available: false },
  towers: { slug: 'towers', title: 'Towers', kind: 'OPEN_ROUND', available: false },
  crash: { slug: 'crash', title: 'Crash', kind: 'SHARED_ROUND', available: false },
  roulette: { slug: 'roulette', title: 'Roulette', kind: 'SHARED_ROUND', available: false },
  'dragon-tiger': {
    slug: 'dragon-tiger',
    title: 'Dragon Tiger',
    kind: 'SHARED_ROUND',
    available: false,
  },
  'sic-bo': { slug: 'sic-bo', title: 'Sic Bo', kind: 'SHARED_ROUND', available: false },
};

export function isGameSlug(value: string): value is GameSlug {
  return Object.prototype.hasOwnProperty.call(GAMES, value);
}

export function gamesByKind(kind: GameKind): GameDefinition[] {
  return Object.values(GAMES).filter((g) => g.kind === kind);
}

export const AVAILABLE_GAMES: GameDefinition[] = Object.values(GAMES).filter((g) => g.available);
