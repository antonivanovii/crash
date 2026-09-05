import { Progress, SidebarGroup, SidebarItem, SidebarNav } from '@kobold/ui';
import { Link, useLocation } from '@tanstack/react-router';
import './account-sidebar.css';

/**
 * Навигация аккаунта. В макете она 216px против 232px у лобби — разницу
 * не переношу: две почти одинаковые ширины в коде превратились бы в две
 * переменные и два места для ошибки.
 */
export const ACCOUNT_SECTIONS = [
  { to: '/account', label: 'Профиль' },
  { to: '/account/security', label: 'Безопасность' },
  { to: '/account/limits', label: 'Лимиты и пауза' },
  { to: '/account/verification', label: 'Верификация' },
  { to: '/account/notifications', label: 'Уведомления' },
  { to: '/account/payment-methods', label: 'Способы оплаты' },
  { to: '/account/sessions', label: 'Активные сессии' },
] as const;

export function AccountSidebar() {
  const { pathname } = useLocation();

  return (
    <SidebarNav
      footer={
        <div className="account-sidebar__level">
          <div className="kb-overline account-sidebar__level-kicker">До LVL 4</div>
          <Progress value={6200} max={10000} valueLabel="6 200 / 10 000" />
          <p className="account-sidebar__level-note">
            На четвёртом уровне кэшбэк станет 9%, а лимит вывода — 300 000 ₽ в сутки.
          </p>
        </div>
      }
    >
      <SidebarGroup>
        {ACCOUNT_SECTIONS.map((section) => (
          <SidebarItem
            key={section.to}
            as={Link}
            to={section.to}
            label={section.label}
            active={pathname === section.to}
          />
        ))}
      </SidebarGroup>
    </SidebarNav>
  );
}
