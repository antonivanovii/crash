import type { GameSlug } from '@kobold/game-engine';
import { Badge } from '@kobold/ui';
import clsx from 'clsx';
import type { ElementType, ReactNode } from 'react';
import { GameArt, GameArtPlaceholder } from './GameArt.js';
import './game-card.css';

export interface GameCardProps {
  slug: GameSlug;
  title: string;
  /** RTP и число сыгранных партий. На мобильном не показываются — места нет. */
  rtp?: string;
  plays?: string;
  /** Промо-карточка: тёплый арт и пилюля в углу. */
  promo?: ReactNode;
  /**
   * Идущий раунд. Значение показывается статикой: множитель тикает на экране
   * игры, а не в лобби — иначе лобби держит подписку на каждую общую игру.
   */
  live?: ReactNode;
  /** Игра из каталога, но ещё не подключённая: арт виден, вход закрыт. */
  soon?: boolean;
  as?: ElementType;
  className?: string;
  [key: string]: unknown;
}

export function GameCard({
  slug,
  title,
  rtp,
  plays,
  promo,
  live,
  soon,
  as: Component = 'div',
  className,
  ...rest
}: GameCardProps) {
  return (
    <Component
      {...rest}
      className={clsx(
        'game-card',
        promo && 'game-card--promo',
        live && 'game-card--live',
        soon && 'game-card--pending',
        className,
      )}
    >
      <div className="game-card__media">
        <GameArt slug={slug} hot={Boolean(promo)} />
        {promo ? (
          <Badge size="s" className="game-card__promo">
            {promo}
          </Badge>
        ) : null}
        {live ? (
          <>
            <span className="game-card__live-value kb-num">{live}</span>
            <span className="game-card__live-label">LIVE</span>
          </>
        ) : null}
      </div>
      <div className="game-card__footer">
        <div className="game-card__title">{title}</div>
        {soon ? (
          <div className="game-card__meta">
            <span>скоро</span>
          </div>
        ) : rtp || plays ? (
          <div className="game-card__meta">
            <span>{rtp}</span>
            <span>{plays}</span>
          </div>
        ) : null}
      </div>
    </Component>
  );
}

/** Карточка игры, которой ещё нет: пунктир и срок вместо метрик. */
export function GameCardSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="game-card game-card--soon">
      <GameArtPlaceholder />
      <div className="game-card__footer">
        <div className="game-card__title">{title}</div>
        <div className="game-card__meta">
          <span>{note}</span>
        </div>
      </div>
    </div>
  );
}
