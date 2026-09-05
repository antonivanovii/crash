import { formatMoney, formatMultiplier, type CurrencyCode, type Multiplier } from '@kobold/money';
import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { MascotHead } from './Mascot.js';

/* ── Выписка ────────────────────────────────────────────────────────────── */
export interface LedgerRowData {
  id: string;
  title: ReactNode;
  /** Время и подробность: «25.08 14:05 · в эскроу». */
  meta: ReactNode;
  amount: bigint;
  balanceAfter: bigint | null;
  currency: CurrencyCode;
  /** Ссылка на источник: раунд, ставка, сделка. Это предъявляют при споре. */
  source?: ReactNode;
}

export function LedgerTable({ rows }: { rows: readonly LedgerRowData[] }) {
  return (
    <div className="kb-ledger">
      <div className="kb-ledger__head">
        <div>Операция</div>
        <div style={{ textAlign: 'right' }}>Сумма</div>
        <div style={{ textAlign: 'right' }}>Баланс после</div>
        <div style={{ textAlign: 'right' }}>Источник</div>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="kb-ledger__row">
          <div>
            <div className="kb-ledger__title">{row.title}</div>
            <div className="kb-ledger__meta">{row.meta}</div>
          </div>
          <div
            className={clsx(
              'kb-ledger__amount',
              row.amount >= 0n ? 'kb-ledger__amount--in' : 'kb-ledger__amount--out',
            )}
          >
            {row.amount >= 0n ? '+' : '−'}
            {formatMoney(row.amount < 0n ? -row.amount : row.amount, row.currency).replace(
              /^\D+/,
              '',
            )}
          </div>
          <div className="kb-ledger__balance">
            {row.balanceAfter === null
              ? '—'
              : formatMoney(row.balanceAfter, row.currency).replace(/^\D+/, '')}
          </div>
          <div className="kb-ledger__source">{row.source ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Кнопка котировки ───────────────────────────────────────────────────── */

/**
 * Одна кнопка на коэффициенты спорта и на «Да/Нет» маркетов.
 *
 * В макетах они нарисованы порознь, но структура совпадает: подпись сверху,
 * моноширинное значение снизу, рамка меняет цвет по состоянию. Различаются
 * только тона, поэтому это один компонент, а не два похожих.
 *
 * Состояние цены показывается тремя способами сразу — рамкой, цветом числа
 * и стрелкой в подписи. Одного мало: игрок смотрит на число, а не на рамку.
 */
export type QuoteTone = 'neutral' | 'selected' | 'up' | 'down' | 'yes' | 'no';
export type QuoteSize = 'l' | 'm' | 's';

export interface QuoteButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  label: ReactNode;
  /**
   * Значение в сотых: коэффициент 1.85 → 185n, цена 62¢ → 6200n.
   * `null` — линии нет, кнопка мертва.
   */
  value: Multiplier | null;
  tone?: QuoteTone;
  size?: QuoteSize;
  /** Предыдущее значение — показывается второй строкой при падении цены. */
  previousValue?: Multiplier;
  /** Приём закрыт: замок вместо числа. Не то же самое, что просто disabled. */
  suspended?: boolean;
  /** Как отрисовать значение. По умолчанию — коэффициент вида «1.85». */
  format?: (value: Multiplier) => string;
}

export function QuoteButton({
  label,
  value,
  tone = 'neutral',
  size = 'l',
  previousValue,
  suspended,
  format = formatMultiplier,
  disabled,
  className,
  ...rest
}: QuoteButtonProps) {
  const empty = value === null;

  return (
    <button
      {...rest}
      type="button"
      aria-pressed={tone === 'selected'}
      disabled={disabled || suspended || empty}
      className={clsx(
        'kb-quote',
        `kb-quote--${size}`,
        tone !== 'neutral' && !suspended && !empty && `kb-quote--${tone}`,
        suspended && 'kb-quote--suspended',
        empty && !suspended && 'kb-quote--empty',
        className,
      )}
    >
      <span className="kb-quote__label">
        {label}
        {tone === 'up' ? ' ↑' : null}
      </span>
      {suspended ? (
        <span className="kb-quote__lock" aria-label="Приём закрыт">
          🔒
        </span>
      ) : (
        <span className="kb-quote__value">{empty ? '—' : format(value)}</span>
      )}
      {tone === 'down' && previousValue !== undefined ? (
        <span className="kb-quote__previous">↓ {format(previousValue)}</span>
      ) : null}
    </button>
  );
}

/** Цена рынка предсказаний: 6200n → «62¢». Шкала 0–100 центов. */
export function formatCents(value: Multiplier): string {
  return `${value / 100n}¢`;
}

/* ── Баланс ─────────────────────────────────────────────────────────────── */
export function BalanceHeader({
  amount,
  currency,
  action,
  className,
}: {
  amount: bigint;
  currency: CurrencyCode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('kb-balance', className)}>
      <div>
        <div className="kb-balance__label">Баланс</div>
        <div className="kb-balance__value">{formatMoney(amount, currency)}</div>
      </div>
      {action ? <div className="kb-balance__action">{action}</div> : null}
    </div>
  );
}

/**
 * Свободно и в эскроу. Игрок должен понимать, почему свободный баланс меньше
 * суммы, которую он держит в системе.
 */
export function BalanceSplit({
  free,
  escrow,
  currency,
  className,
}: {
  free: bigint;
  escrow: bigint;
  currency: CurrencyCode;
  className?: string;
}) {
  const total = free + escrow;
  const freePercent = total === 0n ? 100 : Number((free * 100n) / total);

  return (
    <div className={clsx('kb-balance-split', className)}>
      <div className="kb-balance-split__row">
        <span>Свободно</span>
        <span className="kb-balance-split__value">{formatMoney(free, currency)}</span>
      </div>
      <div className="kb-balance-split__row">
        <span>В эскроу</span>
        <span className="kb-balance-split__value kb-balance-split__value--escrow">
          {formatMoney(escrow, currency)}
        </span>
      </div>
      <div className="kb-progress kb-progress--split" style={{ marginTop: 10 }}>
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
    </div>
  );
}

/* ── Поле хэша ──────────────────────────────────────────────────────────── */
export function HashField({
  label = 'Server seed hash',
  value,
  onCopy,
  className,
}: {
  label?: ReactNode;
  value: string;
  onCopy?: () => void;
  className?: string;
}) {
  return (
    <div className={clsx('kb-hash', className)}>
      <div className="kb-hash__label">{label}</div>
      <div className="kb-hash__row">
        <div className="kb-hash__value">{value}</div>
        <button
          type="button"
          className="kb-hash__copy"
          aria-label="Скопировать"
          onClick={() => {
            void navigator.clipboard?.writeText(value);
            onCopy?.();
          }}
        >
          ⧉
        </button>
      </div>
    </div>
  );
}

/* ── Пользователь ───────────────────────────────────────────────────────── */
export function Avatar({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <span className={clsx('kb-avatar', className)} style={{ width: size, height: size }}>
      <MascotHead size={size * 0.6} />
    </span>
  );
}

export function User({
  name,
  meta,
  className,
}: {
  name: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('kb-user', className)}>
      <Avatar />
      <div>
        <div className="kb-user__name">{name}</div>
        {meta ? <div className="kb-user__meta">{meta}</div> : null}
      </div>
    </div>
  );
}
