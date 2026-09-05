import { SLOT_ID, slotRef } from '@/shared/ui';
import { useConnectionStore } from '@/shared/model';
import { AppTopbar } from '@/widgets/app-topbar';
import { MobileTabbar } from '@/widgets/mobile-tabbar';
import { Outlet } from '@tanstack/react-router';
import clsx from 'clsx';
import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import './styles/app.css';

/**
 * Оболочка приложения.
 *
 * Скролл ровно один и он внутри контента: страница целиком не двигается,
 * топбар и сайдбар стоят на месте. Отсюда `height:100dvh; overflow:hidden`
 * на корне — без этого iOS начинает тянуть за собой всю страницу, а sticky
 * ведёт себя непредсказуемо при открытых шторках.
 *
 * Сайдбар и правая колонка — слоты: их наполняет страница. Пустой контейнер
 * схлопывается правилом `:empty`, поэтому маркетам, где сайдбара нет,
 * не нужно ничего сообщать оболочке.
 */
export function RootLayout() {
  const notice = useConnectionStore((s) => s.notice);
  const { pathname } = useLocation();

  /**
   * Шторка навигации помнит не «открыта», а «открыта на каком экране». Переход
   * по ссылке внутри неё тогда закрывает её сам, без эффекта на смену маршрута:
   * состояние просто перестаёт совпадать с текущим путём.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const navOpen = openedAt === pathname;
  const toggleNav = () => setOpenedAt(navOpen ? null : pathname);

  return (
    <div className={clsx('app-shell', navOpen && 'app-shell--nav-open')}>
      <AppTopbar onToggleNav={toggleNav} navOpen={navOpen} />

      {/* Баннер приостановки: когда фид молчит и рынки закрыты. */}
      {notice ? <div className="app-notice">{notice.message}</div> : null}

      <div className="app-shell__body">
        <aside ref={slotRef(SLOT_ID.sidebar)} className="app-shell__sidebar" />

        {/* Подложка под сайдбаром-шторкой. На десктопе её нет вовсе. */}
        <div
          className="app-shell__scrim"
          onClick={() => setOpenedAt(null)}
          aria-hidden={!navOpen}
        />

        <main className="app-shell__content">
          <Outlet />
        </main>

        <div ref={slotRef(SLOT_ID.aside)} className="app-shell__aside" />
      </div>

      <MobileTabbar />
    </div>
  );
}
