import {
  AVAILABLE_GAMES,
  GAMES,
  isGameSlug,
  type GameKind,
  type GameSlug,
} from '@kobold/game-engine';

/**
 * Сущность «игра» — только метаданные: слаг, название, вид примитива.
 *
 * Экраны здесь не регистрируются намеренно: сущность не имеет права знать
 * про фичи, иначе слои разъедутся. Реестр экранов живёт в pages/game.
 */
export { AVAILABLE_GAMES, GAMES, isGameSlug };
export type { GameKind, GameSlug };

const KIND_LABELS: Record<GameKind, string> = {
  ATOMIC: 'Своя ставка',
  OPEN_ROUND: 'Раунд с шагами',
  SHARED_ROUND: 'Общий раунд',
};

export function gameKindLabel(kind: GameKind): string {
  return KIND_LABELS[kind];
}

export function gameTitle(slug: string): string {
  return isGameSlug(slug) ? GAMES[slug].title : 'Игра';
}
