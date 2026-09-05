import type { GameSlug } from '@kobold/game-engine';
import clsx from 'clsx';
import './game-art.css';

/**
 * Арт игры.
 *
 * В макете каждая из одиннадцати карточек нарисована CSS-фигурами, и сам макет
 * помечает их временными — на плейсхолдере написано «АРТ 640×640». Поэтому все
 * они собраны за одним компонентом: когда придут настоящие иллюстрации,
 * меняется одно место, а не одиннадцать карточек.
 *
 * Фигуры геометричные, без перспективы и 3D — как требует раздел «Иконки»
 * дизайн-системы.
 */
const DOTS_9 = Array.from({ length: 9 }, (_, i) => i);

function art(slug: GameSlug) {
  switch (slug) {
    case 'dice':
      return (
        <div className="game-art__dice">
          {DOTS_9.map((i) => (
            <span key={i} />
          ))}
        </div>
      );

    case 'mines':
      return (
        <div className="game-art__grid">
          {DOTS_9.map((i) => (
            <span key={i} className={clsx(i === 4 && 'is-mine', [0, 2, 6].includes(i) && 'is-safe')} />
          ))}
        </div>
      );

    case 'towers':
      return (
        <div className="game-art__towers">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} />
          ))}
        </div>
      );

    case 'plinko':
      return (
        <div className="game-art__plinko">
          {[3, 4, 5].map((count) => (
            <div key={count} className="game-art__plinko-row">
              {Array.from({ length: count }, (_, i) => (
                <span key={i} />
              ))}
            </div>
          ))}
          <div className="game-art__plinko-slots">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} />
            ))}
          </div>
        </div>
      );

    case 'wheel':
      return <div className="game-art__wheel" />;

    case 'crash':
      return <div className="game-art__trail" />;

    case 'keno':
      return (
        <div className="game-art__keno">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={clsx([1, 4, 6, 11, 14].includes(i) && 'is-hit')} />
          ))}
        </div>
      );

    case 'roulette':
      return <div className="game-art__roulette" />;

    case 'dragon-tiger':
      return (
        <div className="game-art__cards">
          <span />
          <span />
        </div>
      );

    case 'sic-bo':
      return (
        <div className="game-art__sicbo">
          <span />
          <span />
        </div>
      );

    // Limbo рисуется целиком псевдоэлементами — своей фигуры внутри нет.
    case 'limbo':
      return null;
  }
}

export interface GameArtProps {
  slug: GameSlug;
  /** Тёплый фон промо-карточки: она должна читаться первой в сетке. */
  hot?: boolean;
  className?: string;
}

export function GameArt({ slug, hot, className }: GameArtProps) {
  return (
    <div
      aria-hidden
      className={clsx('game-art', `game-art--${slug}`, hot && 'game-art--hot', className)}
    >
      {art(slug)}
    </div>
  );
}

/** Место под игру, которой ещё нет. Размер подписан прямо в макете. */
export function GameArtPlaceholder({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx('game-art', 'game-art--placeholder', className)}>
      АРТ
      <br />
      640×640
    </div>
  );
}
