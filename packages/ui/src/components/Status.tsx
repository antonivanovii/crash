import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

/* ── Бейдж ──────────────────────────────────────────────────────────────── */
export type BadgeTone = 'neutral' | 'live' | 'win' | 'loss' | 'escrow' | 'muted' | 'tag';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Точка слева. У LIVE она пульсирует — это единственная пульсация в системе. */
  dot?: boolean;
  /** `s` — внутри карточки и на мобильном. Макетные 19/20/22 сводятся сюда. */
  size?: 'm' | 's';
}

export function Badge({ tone = 'neutral', dot, size = 'm', className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      className={clsx(
        'kb-badge',
        tone !== 'neutral' && `kb-badge--${tone}`,
        size === 's' && 'kb-badge--s',
        className,
      )}
    >
      {dot || tone === 'live' ? <span className="kb-badge__dot" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function Counter({
  value,
  className,
  ...rest
}: { value: number } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...rest} className={clsx('kb-counter', className)}>
      {value > 99 ? '99+' : value}
    </span>
  );
}

/* ── Соединение ─────────────────────────────────────────────────────────── */
export type ConnectionState = 'online' | 'connecting' | 'offline';

const CONNECTION_LABELS: Record<ConnectionState, { title: string; note: string; icon: string }> = {
  online: { title: 'Соединение', note: 'связь есть', icon: '✓' },
  connecting: { title: 'Восстанавливаем', note: 'переподключаемся…', icon: '↻' },
  offline: { title: 'Связь потеряна', note: 'переподключаемся…', icon: '!' },
};

export interface ConnectionStatusProps {
  state: ConnectionState;
  /** Пинг в миллисекундах — показывается только когда связь есть. */
  latencyMs?: number;
  /** Компактный вид для хедера: точка и подпись, без карточки. */
  inline?: boolean;
  className?: string;
}

/**
 * Индикатор соединения — обязательный элемент, а не украшение: в crash
 * и рулетке от связи зависит, засчитается ли кэшаут.
 */
export function ConnectionStatus({ state, latencyMs, inline, className }: ConnectionStatusProps) {
  const copy = CONNECTION_LABELS[state];

  if (inline) {
    return (
      <span
        className={clsx('kb-status', 'kb-status--inline', `kb-status--${state}`, className)}
        role="status"
      >
        <span className="kb-status__dot" aria-hidden />
        {state === 'online' ? 'Связь есть' : copy.title}
      </span>
    );
  }

  return (
    <div className={clsx('kb-status', `kb-status--${state}`, className)} role="status">
      <span className="kb-status__icon" aria-hidden>
        {copy.icon}
      </span>
      <span>
        <span className="kb-status__title">{copy.title}</span>
        <span className="kb-status__note kb-num" style={{ display: 'block' }}>
          {state === 'online' && latencyMs !== undefined ? `${latencyMs} мс` : copy.note}
        </span>
      </span>
    </div>
  );
}

/* ── Баннер ─────────────────────────────────────────────────────────────── */
export type AlertTone = 'neutral' | 'warning' | 'danger' | 'success';

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone;
  title: ReactNode;
  icon?: ReactNode;
}

const ALERT_ICONS: Record<AlertTone, string> = {
  neutral: 'i',
  warning: '!',
  danger: '!',
  success: '✓',
};

export function Alert({ tone = 'neutral', title, icon, className, children, ...rest }: AlertProps) {
  return (
    <div
      {...rest}
      role={tone === 'danger' ? 'alert' : 'status'}
      className={clsx('kb-alert', tone !== 'neutral' && `kb-alert--${tone}`, className)}
    >
      <span className="kb-alert__icon" aria-hidden>
        {icon ?? ALERT_ICONS[tone]}
      </span>
      <div>
        <div className="kb-alert__title">{title}</div>
        {children ? <div className="kb-alert__body">{children}</div> : null}
      </div>
    </div>
  );
}

/* ── Прогресс ───────────────────────────────────────────────────────────── */
export interface ProgressProps {
  value: number;
  max?: number;
  label?: ReactNode;
  valueLabel?: ReactNode;
  /**
   * Цвет заполнения по смыслу шкалы: янтарь — прогресс уровня, mint —
   * израсходованный лимит, rose — проигрыш. Один цвет на все шкалы врал бы:
   * «использовано 25%» и «проиграно 48%» читаются одинаково хорошо только
   * до тех пор, пока не окажется, что второе — плохая новость.
   */
  tone?: 'amber' | 'win' | 'loss';
  className?: string;
}

export function Progress({
  value,
  max = 100,
  label,
  valueLabel,
  tone = 'amber',
  className,
}: ProgressProps) {
  const percent = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx('kb-progress', className)}>
      {label ? <span className="kb-progress__label kb-progress__label--level">{label}</span> : null}
      <div
        className="kb-progress__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={clsx('kb-progress__fill', tone !== 'amber' && `kb-progress__fill--${tone}`)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {valueLabel ? <span className="kb-progress__label">{valueLabel}</span> : null}
    </div>
  );
}

/**
 * Составной трек: свободные средства и то, что в эскроу. Игрок должен видеть,
 * почему свободный баланс меньше суммы, которую он держит в системе.
 */
export function BalanceMeter({
  free,
  escrow,
  className,
}: {
  free: bigint;
  escrow: bigint;
  className?: string;
}) {
  const total = free + escrow;
  const freePercent = total === 0n ? 100 : Number((free * 100n) / total);

  return (
    <div className={clsx('kb-progress', 'kb-progress--split', className)}>
      <div className="kb-progress__track">
        <div
          className="kb-progress__segment kb-progress__segment--free"
          style={{ width: `${freePercent}%` }}
        />
        <div
          className="kb-progress__segment kb-progress__segment--escrow"
          style={{ width: `${100 - freePercent}%` }}
        />
      </div>
    </div>
  );
}
