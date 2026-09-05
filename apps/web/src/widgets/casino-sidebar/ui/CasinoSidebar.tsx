import { CATEGORIES, countInCategory, type GameCategory } from '@/entities/game';
import { Progress, SidebarGroup, SidebarItem, SidebarNav } from '@kobold/ui';
import { Link } from '@tanstack/react-router';
import './casino-sidebar.css';

const MY_ITEMS: Array<{ to: string; label: string; count?: number }> = [
  { to: '/', label: 'Избранное', count: 4 },
  { to: '/', label: 'Недавние' },
  { to: '/casino/history', label: 'История ставок' },
];

export interface CasinoSidebarProps {
  category: GameCategory;
  onCategoryChange: (category: GameCategory) => void;
}

/**
 * Навигация лобби. Секции живых столов здесь нет: это видеотрансляция
 * с реальным дилером, а каталог состоит только из своих игр.
 */
export function CasinoSidebar({ category, onCategoryChange }: CasinoSidebarProps) {
  return (
    <SidebarNav
      footer={
        <div className="casino-sidebar__fairness">
          <div className="kb-overline">Честность</div>
          <p className="casino-sidebar__fairness-note">
            Каждый раунд считается из сида, который опубликован до игры. Проверить можно
            самому.
          </p>
          <Link to="/fairness" className="casino-sidebar__link">
            Как это работает →
          </Link>
        </div>
      }
    >
      <SidebarGroup title="Играть">
        {CATEGORIES.map((item) => (
          <SidebarItem
            key={item.id}
            label={item.label}
            icon={item.id === 'all' ? 'triangle' : 'circle'}
            count={countInCategory(item.id)}
            active={category === item.id}
            onClick={() => onCategoryChange(item.id)}
          />
        ))}
      </SidebarGroup>

      <SidebarGroup title="Моё">
        {MY_ITEMS.map((item) => (
          <SidebarItem key={item.label} as={Link} to={item.to} label={item.label} count={item.count} />
        ))}
      </SidebarGroup>

      <SidebarGroup title="Бонусы">
        <div className="casino-sidebar__level">
          <div className="casino-sidebar__level-head">
            <span className="casino-sidebar__level-title">LVL 3 · Хитрец</span>
            <span className="casino-sidebar__level-left kb-num">до LVL 4 — 3 800 ₽</span>
          </div>
          <Progress value={6200} max={10000} />
          <p className="casino-sidebar__level-note">
            На четвёртом уровне кэшбэк станет 9%, а лимит вывода — 300 000 ₽ в сутки.
          </p>
        </div>
        <SidebarItem as={Link} to="/account" label="Промокод" icon="square" />
        <SidebarItem as={Link} to="/account" label="Турниры" icon="diamond" count={2} />
      </SidebarGroup>
    </SidebarNav>
  );
}
