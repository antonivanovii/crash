import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import { Mascot, type MascotScenario } from './Mascot.js';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'tile';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'line',
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      {...rest}
      aria-hidden
      className={clsx('kb-skeleton', `kb-skeleton--${variant}`, className)}
      style={{ ...style, width, height }}
    />
  );
}

/** Три строки текста, гаснущие к последней: блок читается как абзац, а не как сетка. */
export function SkeletonText({ className }: { className?: string }) {
  return (
    <div className={clsx('kb-skeleton-lines', className)} aria-hidden>
      <div className="kb-skeleton kb-skeleton--line" />
      <div className="kb-skeleton kb-skeleton--line" />
      <div className="kb-skeleton kb-skeleton--line" />
    </div>
  );
}

export function Spinner({ size = 'm', className }: { size?: 'm' | 's'; className?: string }) {
  return (
    <span className={clsx('kb-spinner', size === 's' && 'kb-spinner--s', className)} aria-hidden />
  );
}

/**
 * Плашка долгой операции. Текст говорит, что происходит и что делать —
 * «Подтверждаем ставку… не закрывай окно», а не «Загрузка».
 */
export function Pending({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('kb-pending', className)} role="status">
      <Spinner />
      <span>{children}</span>
    </div>
  );
}

export interface EmptyStateProps {
  title: ReactNode;
  note?: ReactNode;
  /** Маскот появляется там, где пусто, страшно или непонятно. По умолчанию 96 px. */
  scenario?: MascotScenario;
  mascotSize?: number;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  note,
  scenario = 'empty',
  mascotSize = 96,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={clsx('kb-empty', className)}>
      <Mascot scenario={scenario} size={mascotSize} className="kb-empty__art" />
      <div className="kb-empty__title">{title}</div>
      {note ? <div className="kb-empty__note">{note}</div> : null}
      {action}
    </div>
  );
}

/** Компактное пустое состояние: ничего не нашлось, фильтр не дал результатов. */
export function EmptyInline({
  title,
  note,
  icon = '⌕',
  className,
}: {
  title: ReactNode;
  note?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('kb-empty', 'kb-empty--inline', className)}>
      <span className="kb-empty__icon" aria-hidden>
        {icon}
      </span>
      <div>
        <div className="kb-empty__title">{title}</div>
        {note ? <div className="kb-empty__note">{note}</div> : null}
      </div>
    </div>
  );
}
