import clsx from 'clsx';
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';

/**
 * Escape закрывает всё, что лежит поверх контента, и заодно блокирует скролл
 * страницы: иначе под открытой шторкой уезжает лобби.
 */
function useDismissOnEscape(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);
}

/* ── Тост ───────────────────────────────────────────────────────────────── */
export type ToastTone = 'neutral' | 'price' | 'success' | 'error';

export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: ToastTone;
  title: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
}

const TOAST_ICONS: Record<ToastTone, string> = {
  neutral: '⧉',
  price: '↑',
  success: '✓',
  error: '!',
};

export function Toast({
  tone = 'neutral',
  title,
  icon,
  onClose,
  className,
  children,
  ...rest
}: ToastProps) {
  return (
    <div
      {...rest}
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx('kb-toast', tone !== 'neutral' && `kb-toast--${tone}`, className)}
    >
      <span className="kb-toast__icon" aria-hidden>
        {icon ?? TOAST_ICONS[tone]}
      </span>
      <div className="kb-toast__body">
        <div className="kb-toast__title">{title}</div>
        {children ? <div className="kb-toast__note">{children}</div> : null}
      </div>
      {onClose ? (
        <button type="button" className="kb-toast__close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function ToastStack({ children }: { children: ReactNode }) {
  return (
    <div className="kb-toast-stack" aria-live="polite">
      {children}
    </div>
  );
}

/* ── Тултип ─────────────────────────────────────────────────────────────── */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <span className="kb-tooltip">
      {children}
      <span className="kb-tooltip__bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}

/* ── Модалка ────────────────────────────────────────────────────────────── */
export interface ModalProps {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  /** Красная рамка — необратимое действие: самоисключение, отмена заявки. */
  tone?: 'neutral' | 'danger';
}

export function Modal({ open, title, subtitle, onClose, children, actions, tone = 'neutral' }: ModalProps) {
  useDismissOnEscape(open, onClose);
  if (!open) return null;

  return (
    <div className="kb-overlay" onClick={onClose}>
      <div
        className={clsx('kb-modal', tone !== 'neutral' && `kb-modal--${tone}`)}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-modal__head">
          <div>
            <div className="kb-modal__title">{title}</div>
            {subtitle ? <div className="kb-modal__subtitle">{subtitle}</div> : null}
          </div>
          <button type="button" className="kb-modal__close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="kb-modal__body">
          {children}
          {actions ? <div className="kb-modal__actions">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

/* ── Шторка снизу ───────────────────────────────────────────────────────── */
export interface SheetProps {
  open: boolean;
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Акцент верхней кромки. Янтарь — честность, красный — необратимое действие. */
  tone?: 'neutral' | 'amber' | 'danger';
}

/** Насколько нужно утянуть шторку вниз, чтобы она закрылась. */
const DISMISS_THRESHOLD_PX = 96;

/**
 * Шторка снизу.
 *
 * Крестика нет намеренно: на 390px он попадает в зону большого пальца хуже,
 * чем сам жест. Закрывается тремя способами — тап мимо, потянуть за выступ
 * вниз, Escape с клавиатуры.
 *
 * Закрытие проигрывается, а не обрывается: шторка, исчезающая мгновенно,
 * читается как сбой.
 */
export function Sheet({ open, title, onClose, children, tone = 'neutral' }: SheetProps) {
  useDismissOnEscape(open, onClose);

  // Состояние подгоняется во время рендера, а не в эффекте: так закрытие
  // начинается в том же кадре, в котором пришло open=false.
  const [wasOpen, setWasOpen] = useState(open);
  const [closing, setClosing] = useState(false);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setClosing(true);
  }

  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startY: 0, offset: 0 });

  if (!open && !closing) return null;

  /**
   * Перетаскивание идёт через ref и прямую запись в style: держать смещение
   * в состоянии — это ре-рендер на каждый кадр жеста.
   */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!open) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, offset: 0 };
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) || !sheetRef.current) return;
    // Вверх шторка не тянется: тянуть можно только к закрытию.
    drag.current.offset = Math.max(0, e.clientY - drag.current.startY);
    sheetRef.current.style.transform = `translateY(${drag.current.offset}px)`;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.style.transition = '';
    sheet.style.transform = '';
    if (drag.current.offset > DISMISS_THRESHOLD_PX) onClose();
  };

  return (
    <div
      className={clsx('kb-overlay', 'kb-overlay--bottom', closing && 'kb-overlay--closing')}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className={clsx(
          'kb-sheet',
          tone !== 'neutral' && `kb-sheet--${tone}`,
          closing && 'kb-sheet--closing',
        )}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => setClosing(false)}
      >
        <div
          className="kb-sheet__grabber"
          role="button"
          tabIndex={0}
          aria-label="Закрыть"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClose();
          }}
        />
        <div className="kb-sheet__body">
          {title ? <div className="kb-sheet__title">{title}</div> : null}
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Боковой шторки здесь нет намеренно. Единственный её потребитель — сайдбар
 * раздела на планшете, а он и так живёт в оболочке приложения: там та же
 * колонка просто меняет позиционирование по медиазапросу. Отдельный компонент
 * означал бы вторую копию той же навигации в DOM.
 */

/* ── Дропдаун ───────────────────────────────────────────────────────────── */
export interface DropdownOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface DropdownProps<T extends string> {
  heading?: ReactNode;
  options: readonly DropdownOption<T>[];
  value?: T;
  onSelect: (value: T) => void;
  className?: string;
}

export function Dropdown<T extends string>({
  heading,
  options,
  value,
  onSelect,
  className,
}: DropdownProps<T>) {
  return (
    <div className={clsx('kb-dropdown', className)} role="listbox">
      {heading ? <div className="kb-dropdown__head">{heading}</div> : null}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={option.value === value}
          disabled={option.disabled}
          className="kb-dropdown__item"
          onClick={() => onSelect(option.value)}
        >
          {option.label}
          {option.value === value ? <span aria-hidden>✓</span> : null}
        </button>
      ))}
    </div>
  );
}
