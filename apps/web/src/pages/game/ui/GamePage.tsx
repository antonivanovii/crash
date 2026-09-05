import { gameTitle, isGameSlug, type GameSlug } from '@/entities/game';
import { Placeholder } from '@/shared/ui';
import { useParams } from '@tanstack/react-router';
import { Suspense, lazy, type ComponentType } from 'react';

/**
 * Один маршрут на все игры: `/casino/$gameSlug`, а не одиннадцать отдельных.
 *
 * Реестр экранов живёт именно здесь, на слое pages: только он имеет право
 * знать про фичи. Каждая игра — ленивый чанк, и тот, кто зашёл в Limbo,
 * не тянет код Plinko и рулетки.
 */
const SCREENS: Partial<Record<GameSlug, ComponentType>> = {
  limbo: lazy(() => import('@/features/play-limbo').then((m) => ({ default: m.Limbo }))),
};

export function GamePage() {
  const { gameSlug } = useParams({ from: '/casino/$gameSlug' });
  const Screen = isGameSlug(gameSlug) ? SCREENS[gameSlug] : undefined;

  if (!Screen) {
    return <Placeholder title={gameTitle(gameSlug)} note="Игра ещё не подключена." />;
  }

  return (
    <Suspense fallback={<div className="page page__stub">Загружаем игру…</div>}>
      <Screen />
    </Suspense>
  );
}
