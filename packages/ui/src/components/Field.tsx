import clsx from 'clsx';
import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

export interface FieldProps {
  label?: ReactNode;
  /**
   * Текст ошибки. По тону: что случилось и насколько промах —
   * «Больше свободного баланса на 101 548,00 ₽», а не «Недостаточно средств».
   */
  error?: ReactNode;
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="kb-field">
      {label ? (
        <label className="kb-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      {children({ id, invalid: Boolean(error), describedBy: error ? errorId : undefined })}
      {error ? (
        <span className="kb-field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Моноширинный ввод — для сумм, сидов, nonce и хэшей. */
  numeric?: boolean;
}

export function Input({ invalid, numeric, className, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={clsx('kb-input', numeric && 'kb-input--num', className)}
    />
  );
}

export interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  /** Символ валюты справа от суммы. */
  suffix?: string;
  invalid?: boolean;
  /** Быстрые действия: половина, удвоить, весь баланс. */
  onHalve?: () => void;
  onDouble?: () => void;
  onMax?: () => void;
}

/**
 * Поле суммы. Ввод всегда моноширинный: цифры не должны прыгать по ширине,
 * когда игрок правит ставку на автобете.
 */
export function AmountInput({
  value,
  onValueChange,
  suffix,
  invalid,
  onHalve,
  onDouble,
  onMax,
  className,
  ...rest
}: AmountInputProps) {
  const hasQuick = Boolean(onHalve || onDouble || onMax);

  return (
    <div className={clsx('kb-amount', className)} aria-invalid={invalid || undefined}>
      <input
        {...rest}
        className="kb-amount__input"
        inputMode="decimal"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      />
      {suffix ? <span className="kb-amount__suffix">{suffix}</span> : null}
      {hasQuick ? (
        <div className="kb-amount__quick">
          {onHalve ? (
            <button type="button" className="kb-amount__step" onClick={onHalve}>
              ½
            </button>
          ) : null}
          {onDouble ? (
            <button type="button" className="kb-amount__step" onClick={onDouble}>
              2×
            </button>
          ) : null}
          {onMax ? (
            <button type="button" className="kb-amount__step" onClick={onMax}>
              MAX
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface SelectOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  /** `l` — поле формы (48px), `m` — контрол рядом с чипами (34px). */
  size?: 'l' | 'm';
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  className?: string;
}

/**
 * Селект.
 *
 * Собственный, а не нативный: `<select>` рисует список средствами системы,
 * и внутрь него не попадают ни шрифт, ни цвета, ни тёплая нейтраль. На macOS
 * он выглядит инородно рядом со всем остальным.
 *
 * Список — тот же `.kb-dropdown`, что и у меню сортировки: одно выпадающее
 * меню на систему, а не два похожих.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  size = 'l',
  placeholder,
  invalid,
  disabled,
  className,
  ...rest
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  // Клик мимо закрывает список. Документ здесь — внешняя система, подписка
  // на неё в эффекте законна.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const commit = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
      return;
    }

    if (!open) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + options.length) % options.length);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const option = options[activeIndex];
      if (option) commit(option);
    }
  };

  return (
    <div ref={rootRef} className={clsx('kb-select', `kb-select--${size}`, className)}>
      <button
        {...rest}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className="kb-select__trigger"
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={onKeyDown}
      >
        <span className={clsx('kb-select__value', !selected && 'kb-select__value--empty')}>
          {selected?.label ?? placeholder ?? 'Выбери'}
        </span>
        <span className="kb-select__caret" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="kb-dropdown kb-select__list" role="listbox">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className={clsx(
                'kb-dropdown__item',
                index === activeIndex && 'kb-dropdown__item--active',
              )}
              onPointerEnter={() => setActiveIndex(index)}
              onClick={() => commit(option)}
            >
              {option.label}
              {option.value === value ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className, ...rest }: SearchInputProps) {
  return (
    <div className={clsx('kb-search', className)}>
      <span className="kb-search__icon" aria-hidden />
      <input {...rest} type="search" className="kb-search__input" />
    </div>
  );
}
