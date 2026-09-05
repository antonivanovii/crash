import { useSessionStore } from '@/entities/session';
import { useBalanceStore } from '@/entities/wallet';
import { useIsMobile } from '@/shared/lib';
import { formatMoney, type CurrencyCode } from '@kobold/money';
import { Badge, Button, Counter, LogoMark, SearchInput } from '@kobold/ui';
import { Link } from '@tanstack/react-router';
import './app-topbar.css';

const SECTIONS = [
  { to: '/', label: 'Казино' },
  { to: '/sports', label: 'Спорт' },
  { to: '/markets', label: 'Маркеты', badge: 'NEW' },
] as const;

export interface AppTopbarProps {
  onToggleNav: () => void;
  navOpen: boolean;
}

/**
 * Топбар. Единственный глобальный элемент навигации: сайдбар у каждого раздела
 * свой, а в маркетах его нет вовсе.
 *
 * На мобильном сжимается с 64 до 52px и теряет разделы — они уходят в таббар
 * снизу — и поиск. Остаются лого, баланс и аватар.
 *
 * Индикатора связи здесь нет: в лобби от неё ничего не зависит, а постоянная
 * плашка «восстанавливаем» превращается в шум, который перестают замечать.
 * Его место — экран игры, где от связи зависит, засчитается ли кэшаут.
 */
export function AppTopbar({ onToggleNav, navOpen }: AppTopbarProps) {
  const isMobile = useIsMobile();
  const currency = (useSessionStore((s) => s.user?.currency) ?? 'USD') as CurrencyCode;
  const balance = useBalanceStore((s) => s.balances[currency]);

  return (
    <header className="app-topbar">
      {/* Бургер существует только там, где сайдбар стал шторкой. */}
      <button
        type="button"
        className="app-topbar__burger"
        aria-label={navOpen ? 'Закрыть навигацию' : 'Открыть навигацию'}
        aria-expanded={navOpen}
        onClick={onToggleNav}
      >
        <span />
        <span />
        <span />
      </button>

      <Link to="/" className="app-topbar__logo">
        <LogoMark size={isMobile ? 22 : 24} color="var(--kb-ember-500)" cutout="var(--kb-ink-850)" />
        {isMobile ? null : <span className="app-topbar__wordmark">KOBOLD</span>}
      </Link>

      {isMobile ? null : (
        <nav className="app-topbar__nav">
          {SECTIONS.map((section) => (
            <Link
              key={section.to}
              to={section.to}
              className="app-topbar__link"
              activeProps={{ className: 'app-topbar__link is-active' }}
            >
              {section.label}
              {'badge' in section && section.badge ? (
                <Badge tone="tag" size="s">
                  {section.badge}
                </Badge>
              ) : null}
            </Link>
          ))}
        </nav>
      )}

      {isMobile ? null : (
        <div className="app-topbar__search">
          <SearchInput placeholder="Игра, событие, рынок" />
        </div>
      )}

      <div className="app-topbar__right">
        {/* Баланс — единственный источник истины, приходит по сокету. */}
        <div className="app-topbar__balance">
          <div>
            <div className="app-topbar__balance-label">Баланс</div>
            <div className="app-topbar__balance-value">
              {balance ? formatMoney(BigInt(balance.available), currency) : '—'}
            </div>
          </div>
          <Link to="/wallet" className="app-topbar__topup">
            <Button size={isMobile ? 's' : 'm'} aria-label="Пополнить">
              {isMobile ? '+' : 'Пополнить'}
            </Button>
          </Link>
        </div>

        {isMobile ? null : (
          <Link to="/account" className="app-topbar__bell" aria-label="Уведомления">
            <span className="app-topbar__bell-glyph" aria-hidden />
            <Counter value={6} />
          </Link>
        )}

        <Link to="/account" className="app-topbar__avatar" aria-label="Профиль">
          <LogoMark size={isMobile ? 18 : 20} color="var(--kb-ember-500)" cutout="transparent" />
        </Link>
      </div>
    </header>
  );
}
