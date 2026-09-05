import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Glyph, type GlyphShape } from './Glyph.js';

/* ── Сайдбар раздела ────────────────────────────────────────────────────── */

/**
 * Навигация раздела. Один компонент на лобби, спорт и аккаунт: в макетах они
 * отличаются только содержимым, а строка везде одна и та же — иконка, подпись,
 * счётчик справа.
 *
 * Ссылки не рендерятся здесь: компонент презентационный, а маршрутизация — дело
 * приложения. Вместо этого элемент принимает `as` и лишние пропы прокидывает.
 */
export interface SidebarNavProps {
  children: ReactNode;
  /** Прижатый вниз блок: карточка честности в лобби, формат коэффициентов в спорте. */
  footer?: ReactNode;
  className?: string;
}

export function SidebarNav({ children, footer, className }: SidebarNavProps) {
  return (
    <nav className={clsx('kb-sidebar', className)}>
      <div className="kb-sidebar__groups">{children}</div>
      {footer ? <div className="kb-sidebar__footer">{footer}</div> : null}
    </nav>
  );
}

export function SidebarGroup({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="kb-sidebar__group">
      {title ? <div className="kb-sidebar__group-title">{title}</div> : null}
      <div className="kb-sidebar__items">{children}</div>
    </div>
  );
}

export interface SidebarItemProps {
  label: ReactNode;
  icon?: GlyphShape;
  /** Счётчик справа: сколько игр в категории, сколько событий в виде спорта. */
  count?: number | string;
  active?: boolean;
  /** Пульсирующая синяя точка вместо иконки — идущий раунд или лайв-лента. */
  live?: boolean;
  /** Категория без содержимого: гасится целиком, но остаётся видимой. */
  empty?: boolean;
  onClick?: () => void;
  href?: string;
  /** Элемент-обёртка. Для роутера сюда приезжает Link. */
  as?: React.ElementType;
  [key: string]: unknown;
}

export function SidebarItem({
  label,
  icon,
  count,
  active,
  live,
  empty,
  as: Component = 'button',
  ...rest
}: SidebarItemProps) {
  return (
    <Component
      {...rest}
      type={Component === 'button' ? 'button' : undefined}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'kb-sidebar__item',
        active && 'kb-sidebar__item--active',
        live && 'kb-sidebar__item--live',
        empty && 'kb-sidebar__item--empty',
      )}
    >
      {live ? (
        <span className="kb-sidebar__pulse" aria-hidden />
      ) : icon ? (
        <Glyph shape={icon} size={icon === 'triangle' ? 18 : 15} filled={active && icon === 'triangle'} />
      ) : null}
      <span className="kb-sidebar__label">{label}</span>
      {count === undefined ? null : <span className="kb-sidebar__count">{count}</span>}
    </Component>
  );
}

/* ── Нижний таббар ──────────────────────────────────────────────────────── */

export interface TabBarItemProps {
  label: ReactNode;
  icon: GlyphShape;
  active?: boolean;
  /** Счётчик поверх иконки: плечи в купоне, непрочитанные. */
  badge?: number;
  as?: React.ElementType;
  [key: string]: unknown;
}

/**
 * Мобильная навигация. Пять вкладок — предел, за которым подписи перестают
 * читаться на 390px, поэтому категории раздела сюда не поднимаются: они живут
 * в чипах над контентом.
 */
export function TabBar({ children }: { children: ReactNode }) {
  return <nav className="kb-tabbar">{children}</nav>;
}

export function TabBarItem({
  label,
  icon,
  active,
  badge,
  as: Component = 'button',
  ...rest
}: TabBarItemProps) {
  return (
    <Component
      {...rest}
      type={Component === 'button' ? 'button' : undefined}
      aria-current={active ? 'page' : undefined}
      className={clsx('kb-tabbar__item', active && 'kb-tabbar__item--active')}
    >
      <span className="kb-tabbar__icon">
        <Glyph shape={icon} size={icon === 'triangle' ? 20 : 18} filled={active && icon === 'triangle'} />
        {badge ? <span className="kb-tabbar__badge">{badge > 9 ? '9+' : badge}</span> : null}
      </span>
      <span className="kb-tabbar__label">{label}</span>
    </Component>
  );
}
