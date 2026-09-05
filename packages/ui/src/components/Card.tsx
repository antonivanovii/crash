import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  nested?: boolean;
  /** Свечение — единственное в системе, и только у активного раунда. */
  live?: boolean;
  /** Без внутренних отступов: когда внутри таблица или список во всю ширину. */
  flush?: boolean;
}

export function Card({ nested, live, flush, className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={clsx(
        'kb-card',
        nested && 'kb-card--nested',
        live && 'kb-card--live',
        flush && 'kb-card--flush',
        className,
      )}
    />
  );
}

export function CardHead({
  title,
  meta,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('kb-card__head', className)}>
      <div className="kb-title-s">{title}</div>
      {meta ? <div className="kb-overline">{meta}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={clsx('kb-card__body', className)} />;
}
