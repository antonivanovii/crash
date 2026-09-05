import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

/* ── Заголовок секции ───────────────────────────────────────────────────── */

/**
 * Заголовок + подпись + ссылка справа. В макетах встречается девять раз:
 * «Оригиналы Kobold», «Живые столы», разделы кошелька и аккаунта.
 */
export interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Бейдж рядом с заголовком: «6 ОТКРЫТО», счётчик плеч. */
  badge?: ReactNode;
  /** Действие справа: «Все 11 →», «Очистить». */
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, badge, action, className }: SectionHeaderProps) {
  return (
    <div className={clsx('kb-section-header', className)}>
      <h2 className="kb-section-header__title">{title}</h2>
      {badge}
      {subtitle ? <span className="kb-section-header__subtitle">{subtitle}</span> : null}
      {action ? <span className="kb-section-header__action">{action}</span> : null}
    </div>
  );
}

/* ── Строка «ключ — значение» ───────────────────────────────────────────── */

/**
 * Подпись слева, моноширинное значение справа. Четырнадцать вхождений: сводка
 * купона, предпросмотр сделки, метрики рынка, разбивка баланса, статистика лобби.
 *
 * Значение всегда `tabular-nums`: строки выравниваются по разрядам, и при
 * обновлении числа не прыгают.
 */
export interface StatRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label: ReactNode;
  value: ReactNode;
  tone?: 'default' | 'win' | 'loss' | 'escrow' | 'muted';
  /** Крупное значение — итог блока: возможная выплата, «если ДА». */
  emphasis?: boolean;
}

export function StatRow({ label, value, tone = 'default', emphasis, className, ...rest }: StatRowProps) {
  return (
    <div {...rest} className={clsx('kb-stat-row', emphasis && 'kb-stat-row--emphasis', className)}>
      <span className="kb-stat-row__label">{label}</span>
      <span className={clsx('kb-stat-row__value', tone !== 'default' && `kb-stat-row__value--${tone}`)}>
        {value}
      </span>
    </div>
  );
}

/* ── Живой индикатор ────────────────────────────────────────────────────── */

/**
 * Пульсирующая точка. Единственная пульсация в системе — ею помечается то, что
 * прямо сейчас меняется само: идущий раунд, живая лента, работающий фид.
 */
export function PulseDot({
  tone = 'live',
  size = 6,
  still = false,
  className,
}: {
  tone?: 'live' | 'win' | 'loss' | 'muted' | 'warning';
  size?: number;
  /** Без анимации: состояние живое, но статичное — например, стол на паузе. */
  still?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={clsx('kb-pulse-dot', `kb-pulse-dot--${tone}`, still && 'kb-pulse-dot--still', className)}
      style={{ width: size, height: size }}
    />
  );
}
