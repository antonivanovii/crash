import { useBetslipStore } from '@/features/betslip';
import { useIsMobile } from '@/shared/lib';
import { TabBar, TabBarItem, type GlyphShape } from '@kobold/ui';
import { Link, useLocation } from '@tanstack/react-router';
import './mobile-tabbar.css';

const TABS: Array<{ to: string; label: string; icon: GlyphShape }> = [
  { to: '/', label: 'Казино', icon: 'triangle' },
  { to: '/sports', label: 'Спорт', icon: 'circle' },
  { to: '/markets', label: 'Маркеты', icon: 'diamond' },
  { to: '/sports/betslip', label: 'Купон', icon: 'ring' },
  { to: '/account', label: 'Профиль', icon: 'square' },
];

/**
 * Нижняя навигация. Пять вкладок — предел, за которым подписи перестают
 * читаться на 390px, поэтому категории раздела сюда не поднимаются: они живут
 * чипами над контентом.
 *
 * Счётчик висит на купоне: игрок должен видеть, что плечи ждут отправки,
 * с любого экрана.
 */
export function MobileTabbar() {
  const isMobile = useIsMobile();
  const legs = useBetslipStore((s) => s.legs.length);
  const { pathname } = useLocation();

  if (!isMobile) return null;

  return (
    <div className="mobile-tabbar">
      <TabBar>
        {TABS.map((tab) => (
          <TabBarItem
            key={tab.to}
            as={Link}
            to={tab.to}
            label={tab.label}
            icon={tab.icon}
            active={pathname === tab.to || pathname.startsWith(`${tab.to}/`)}
            badge={tab.label === 'Купон' ? legs : undefined}
          />
        ))}
      </TabBar>
    </div>
  );
}
