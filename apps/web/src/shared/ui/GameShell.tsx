import type { ReactNode } from 'react';
import './game-shell.css';

/**
 * Единый каркас экрана игры. Один и тот же для всех одиннадцати:
 *
 *   GameShell
 *     ├── BetPanel     левая колонка, 232px
 *     ├── GameCanvas   область игры
 *     └── GameFooter   nonce, хэш, ссылка на верификатор
 *
 * Игра поставляет три вещи: содержимое панели, компонент отрисовки и хук из
 * рантайма. Это не совпадение, а следствие того, что примитивов три.
 */
export function GameShell({
  panel,
  children,
  footer,
}: {
  panel: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="game-shell">
      <aside className="game-shell__panel">{panel}</aside>
      <main className="game-shell__canvas">{children}</main>
      {footer ? <footer className="game-shell__footer">{footer}</footer> : null}
    </div>
  );
}
