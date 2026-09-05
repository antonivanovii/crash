import clsx from 'clsx';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

/* ── Чип-фильтр ─────────────────────────────────────────────────────────── */
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Снимаемый чип показывает крестик: это активный фильтр, а не переключатель. */
  onRemove?: () => void;
}

export function Chip({ selected, onRemove, className, children, ...rest }: ChipProps) {
  return (
    <button
      {...rest}
      type="button"
      aria-pressed={onRemove ? undefined : selected}
      className={clsx(
        'kb-chip',
        selected && !onRemove && 'kb-chip--selected',
        onRemove && 'kb-chip--removable',
        className,
      )}
    >
      {children}
      {onRemove ? (
        <span
          className="kb-chip__remove"
          role="button"
          tabIndex={-1}
          aria-label="Убрать фильтр"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ✕
        </span>
      ) : null}
    </button>
  );
}

/* ── Сегменты ───────────────────────────────────────────────────────────── */
export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: SegmentedProps<T>) {
  return (
    <div {...rest} role="tablist" className={clsx('kb-segmented', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          disabled={option.disabled}
          className="kb-segmented__item"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ── Табы-подчёркивание ─────────────────────────────────────────────────── */
export interface TabOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Счётчик рядом с названием: «Открытые 3». */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<T extends string> {
  options: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ options, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={clsx('kb-tabs', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          disabled={option.disabled}
          className="kb-tabs__item"
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count === undefined ? null : (
            <span className="kb-tabs__count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Свитч ──────────────────────────────────────────────────────────────── */
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  /**
   * Цвет включённого состояния по смыслу: янтарь — действующий лимит,
   * mint — включённая защита. Оранжевый остаётся обычной настройкой.
   */
  tone?: 'ember' | 'win' | 'amber';
}

export function Switch({ label, tone = 'ember', className, ...rest }: SwitchProps) {
  return (
    <label className={clsx('kb-switch', tone !== 'ember' && `kb-switch--${tone}`, className)}>
      <input {...rest} type="checkbox" />
      <span className="kb-switch__track">
        <span className="kb-switch__thumb" />
      </span>
      {label ? <span className="kb-switch__label">{label}</span> : null}
    </label>
  );
}

/* ── Чекбокс и радио ────────────────────────────────────────────────────── */
export interface CheckProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  variant?: 'checkbox' | 'radio';
}

export function Check({ label, variant = 'checkbox', className, ...rest }: CheckProps) {
  return (
    <label className={clsx('kb-check', variant === 'radio' && 'kb-check--radio', className)}>
      <input {...rest} type={variant} />
      <span className="kb-check__box">
        <span className="kb-check__mark" aria-hidden>
          {variant === 'checkbox' ? '✓' : null}
        </span>
      </span>
      {label ? <span className="kb-check__label">{label}</span> : null}
    </label>
  );
}

/* ── Слайдер ────────────────────────────────────────────────────────────── */
export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  label?: ReactNode;
  /** Текущее значение словами: «3 мины · 1.31×». Число само по себе мало что говорит. */
  valueLabel?: ReactNode;
  value: number;
  min: number;
  max: number;
  /** Подписи под треком: минимум, середина, максимум. */
  scale?: readonly (string | number)[];
  /** Янтарь — лимит времени сессии: он же подсвечивает всю карточку. */
  tone?: 'ember' | 'amber';
}

export function Slider({
  label,
  valueLabel,
  value,
  min,
  max,
  scale,
  tone = 'ember',
  className,
  style,
  ...rest
}: SliderProps) {
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx('kb-slider', tone !== 'ember' && `kb-slider--${tone}`, className)}>
      {label || valueLabel ? (
        <div className="kb-slider__head">
          <span>{label}</span>
          <span className="kb-slider__value">{valueLabel}</span>
        </div>
      ) : null}
      <input
        {...rest}
        type="range"
        className="kb-slider__control"
        value={value}
        min={min}
        max={max}
        style={{ ...style, ['--kb-slider-progress' as string]: `${progress}%` }}
      />
      {scale ? (
        <div className="kb-slider__scale">
          {scale.map((mark) => (
            <span key={String(mark)}>{mark}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
