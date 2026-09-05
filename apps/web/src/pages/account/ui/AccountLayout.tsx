import { useIsMobile } from '@/shared/lib';
import { SidebarSlot } from '@/shared/ui';
import { ACCOUNT_SECTIONS, AccountSidebar } from '@/widgets/account-sidebar';
import { Badge, Button, Mascot, StatRow } from '@kobold/ui';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import './account.css';

/**
 * Оболочка аккаунта: шапка с профилем и навигация подразделов.
 *
 * На мобильном навигация превращается в список с переходом, а не в табы:
 * семь пунктов в строку на 390px не помещаются, а прятать половину под
 * «ещё» — значит спрятать лимиты и самоисключение.
 */
export function AccountLayout() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const atRoot = pathname === '/account';

  // На мобильном корень раздела — это сам список, а не первый подраздел.
  if (isMobile && atRoot) return <AccountMobileIndex />;

  return (
    <>
      <SidebarSlot>
        <AccountSidebar />
      </SidebarSlot>

      <div className="page account">
        <AccountHeader />
        <Outlet />
      </div>
    </>
  );
}

function AccountHeader() {
  return (
    <header className="account-header">
      <span className="account-header__avatar">
        <Mascot scenario="hello" size={64} />
      </span>

      <div className="account-header__body">
        <div className="account-header__name-row">
          <h1 className="account-header__name">koldun_777</h1>
          <Badge tone="escrow" size="s">
            LVL 3 · ХИТРЕЦ
          </Badge>
          <Badge tone="win" size="s">
            ВЕРИФИЦИРОВАН
          </Badge>
        </div>
        <div className="account-header__meta kb-num">
          <span>ID 4 812</span>
          <span>с 12.03.2024</span>
          <span>ставок 1 284</span>
          <span>последний вход 25.08 13:41 · Москва</span>
        </div>
      </div>

      <div className="account-header__actions">
        <Button variant="secondary" size="m">
          Сменить аватар
        </Button>
        <Button variant="secondary" size="m">
          Выйти
        </Button>
      </div>
    </header>
  );
}

/** Мобильный корень раздела: шапка и список с переходом в подразделы. */
function AccountMobileIndex() {
  const trailing: Partial<Record<string, { text: string; tone?: 'win' | 'escrow' }>> = {
    '/account/security': { text: '2FA вкл', tone: 'win' },
    '/account/limits': { text: '60 мин', tone: 'escrow' },
    '/account/verification': { text: '1' },
    '/account/payment-methods': { text: '2 карты' },
  };

  return (
    <div className="page account">
      <AccountHeader />

      <nav className="account-list">
        {ACCOUNT_SECTIONS.filter((section) => section.to !== '/account').map((section) => {
          const meta = trailing[section.to];
          return (
            <Link
              key={section.to}
              to={section.to}
              className={`account-list__row${meta?.tone === 'escrow' ? ' is-accent' : ''}`}
            >
              <span className="account-list__label">{section.label}</span>
              {meta ? (
                <span className={`account-list__meta kb-num${meta.tone ? ` is-${meta.tone}` : ''}`}>
                  {meta.text}
                </span>
              ) : null}
              <span className="account-list__chevron" aria-hidden>
                ›
              </span>
            </Link>
          );
        })}
      </nav>

      <StatRow label="Поддержка" value="24/7" />
    </div>
  );
}
