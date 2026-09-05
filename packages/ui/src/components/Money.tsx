import { formatMoney, type CurrencyCode } from '@kobold/money';
import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export interface MoneyProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  amount: bigint;
  currency: CurrencyCode;
  size?: 'small' | 'large';
  tone?: 'default' | 'win' | 'loss' | 'escrow' | 'muted';
  /** Знак перед суммой: нужен в выписке, где важно направление движения. */
  showSign?: boolean;
}

/**
 * Любая сумма на экране проходит здесь.
 *
 * Форматирование одно на всё приложение, шрифт моноширинный с tabular-nums —
 * иначе цифры прыгают по ширине при каждом обновлении баланса.
 */
export function Money({
  amount,
  currency,
  size = 'small',
  tone = 'default',
  showSign = false,
  className,
  ...rest
}: MoneyProps) {
  const sign = showSign && amount > 0n ? '+' : '';

  return (
    <span
      {...rest}
      className={clsx(
        'kb-money',
        size === 'large' && 'kb-money--large',
        tone !== 'default' && `kb-money--${tone}`,
        className,
      )}
    >
      {sign}
      {formatMoney(amount, currency)}
    </span>
  );
}
