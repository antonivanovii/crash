import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'cashout' | 'market';
export type ButtonSize = 'xl' | 'l' | 'm' | 's';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /**
   * Отклик на нажатие. Кнопка уходит в disabled сразу по клику, а не по ответу
   * сервера: ощущение мгновенности даёт быстрая кнопка, а не преждевременная
   * анимация результата.
   */
  pending?: boolean;
  /** Текст на время ожидания: «Ставим», «Ждём». Молчащий спиннер хуже слова. */
  pendingLabel?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'l',
  block = false,
  pending = false,
  pendingLabel,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={clsx(
        'kb-button',
        `kb-button--${variant}`,
        `kb-button--${size}`,
        block && 'kb-button--block',
        className,
      )}
    >
      {pending ? <span className="kb-button__spinner" aria-hidden /> : null}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'size' | 'block'> {
  'aria-label': string;
}

/** Квадратная кнопка 36×36 под иконку. Подпись обязательна — её читает скринридер. */
export function IconButton({ className, children, pending, disabled, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={clsx('kb-button', 'kb-button--icon', className)}
    >
      {pending ? <span className="kb-button__spinner" aria-hidden /> : children}
    </button>
  );
}
