import { GAMES, type GameSlug } from '@kobold/game-engine';

/**
 * Витринные метрики игр: RTP и число сыгранных партий.
 *
 * Пока константы — на бэкенде каталога ещё нет. Когда появится, эти же поля
 * приедут из `/api/games`, а форма записи не изменится: страница читает
 * `catalogEntry(slug)`, а не объект напрямую.
 */
export interface CatalogEntry {
  readonly rtp: string;
  readonly plays: string;
  /** Редакционная метка в углу карточки. Не позиция в списке — тот меняется сортировкой. */
  readonly promo?: string;
}

const CATALOG: Record<GameSlug, CatalogEntry> = {
  limbo: { rtp: 'RTP 99%', plays: '412', promo: 'ХИТ' },
  dice: { rtp: 'RTP 99%', plays: '388' },
  mines: { rtp: 'RTP 98%', plays: '521' },
  towers: { rtp: 'RTP 98%', plays: '204' },
  plinko: { rtp: 'RTP 99%', plays: '333' },
  wheel: { rtp: 'RTP 97%', plays: '167' },
  crash: { rtp: 'RTP 99%', plays: '1 204' },
  keno: { rtp: 'RTP 97%', plays: '96' },
  roulette: { rtp: 'RTP 97%', plays: '145' },
  'dragon-tiger': { rtp: 'RTP 96%', plays: '72' },
  'sic-bo': { rtp: 'RTP 97%', plays: '58' },
};

export function catalogEntry(slug: GameSlug): CatalogEntry {
  return CATALOG[slug];
}

/**
 * Категории лобби. «Живых столов» здесь нет намеренно: это видеотрансляция
 * с реальным дилером, а мы отдаём только свои игры со своим движком.
 */
/**
 * Категорий «Оригиналы» в макете было две — она и «Все», — потому что там
 * предполагались и сторонние провайдеры. У нас каждая игра своя, поэтому
 * категория схлопнута: дублирующий фильтр только запутывает.
 */
export type GameCategory = 'all' | 'instant' | 'rounds' | 'tables' | 'high-rtp';

export const CATEGORIES: Array<{ id: GameCategory; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'instant', label: 'Мгновенные' },
  { id: 'rounds', label: 'С шагами' },
  { id: 'tables', label: 'Столы' },
  { id: 'high-rtp', label: 'Высокий RTP' },
];

/** Столы — наши собственные, с общим раундом. Мгновенные — атомарная ставка. */
export function matchesCategory(slug: GameSlug, category: GameCategory): boolean {
  const game = GAMES[slug];

  switch (category) {
    case 'all':
      return true;
    case 'instant':
      return game.kind === 'ATOMIC';
    case 'rounds':
      return game.kind === 'OPEN_ROUND';
    case 'tables':
      return game.kind === 'SHARED_ROUND';
    case 'high-rtp':
      return catalogEntry(slug).rtp >= 'RTP 98%';
  }
}

export type GameSort = 'popular' | 'new' | 'rtp' | 'plays';

export const SORTS: Array<{ id: GameSort; label: string }> = [
  { id: 'popular', label: 'По популярности' },
  { id: 'new', label: 'Новые' },
  { id: 'rtp', label: 'По RTP' },
  { id: 'plays', label: 'По числу партий' },
];

/** Число партий приходит строкой с разделителем разрядов: «1 204». */
function playsOf(slug: GameSlug): number {
  return Number(catalogEntry(slug).plays.replace(/\s/g, ''));
}

/**
 * Порядок игр в витрине. «Популярность» и «число партий» пока совпадают —
 * настоящая популярность считается на бэкенде с учётом окна времени.
 */
export function sortGames(slugs: readonly GameSlug[], sort: GameSort): GameSlug[] {
  const sorted = slugs.slice();

  switch (sort) {
    case 'popular':
    case 'plays':
      return sorted.sort((a, b) => playsOf(b) - playsOf(a));
    case 'rtp':
      return sorted.sort((a, b) => catalogEntry(b).rtp.localeCompare(catalogEntry(a).rtp));
    case 'new':
      // Доступные вперёд: «новое» для игрока — то, во что уже можно играть.
      return sorted.sort((a, b) => Number(GAMES[b].available) - Number(GAMES[a].available));
  }
}

export function countInCategory(category: GameCategory): number {
  return Object.keys(GAMES).filter((slug) => matchesCategory(slug as GameSlug, category)).length;
}
