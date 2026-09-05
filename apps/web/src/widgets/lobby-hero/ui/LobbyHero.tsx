import { useIsMobile } from '@/shared/lib';
import { Button, Card, Mascot, PulseDot, StatRow } from '@kobold/ui';
import { Link } from '@tanstack/react-router';
import './lobby-hero.css';

/**
 * Первый экран лобби: промо, статистика и турнир.
 *
 * Тон соблюдён: обещаем условия, а не выигрыш. Вейджер и срок названы прямо
 * в подзаголовке, а не спрятаны за «Условия».
 */
export function LobbyHero() {
  const isMobile = useIsMobile();

  return (
    <div className="lobby-hero">
      <section className="lobby-hero__promo">
        <div className="lobby-hero__promo-body">
          <div className="kb-overline lobby-hero__kicker">Первый депозит</div>
          <h1 className="lobby-hero__title">+100% до 15 000 ₽</h1>
          <p className="lobby-hero__note">
            Вейджер ×15, 14 дней. Пока бонус активен, вывод свободных средств закрыт —
            это указано и в кошельке.
          </p>
          <div className="lobby-hero__actions">
            <Link to="/wallet">
              <Button size={isMobile ? 'm' : 'l'}>Пополнить</Button>
            </Link>
            {isMobile ? null : (
              <Link to="/rules">
                <Button variant="ghost" size="l">
                  Условия
                </Button>
              </Link>
            )}
          </div>
        </div>
        <Mascot scenario="deposit" size={isMobile ? 112 : 190} className="lobby-hero__mascot" />
      </section>

      {isMobile ? null : (
        <div className="lobby-hero__side">
          <Card className="lobby-hero__stats">
            <div className="lobby-hero__stats-head">
              <span className="kb-overline">Сейчас играют</span>
              <span className="lobby-hero__online">
                <PulseDot tone="live" size={6} />
                <span className="kb-num">2 418</span>
              </span>
            </div>
            <div className="kb-money-l">1 284 550 ₽</div>
            <div className="lobby-hero__divider" />
            <StatRow label="Самый крупный вин" value="184 200 ₽" tone="win" />
            <StatRow label="Максимум множителя" value="412.60×" />
          </Card>

          <Card className="lobby-hero__tournament">
            <span className="kb-overline lobby-hero__tournament-kicker">Турнир · 2 дня 04:12</span>
            <div className="kb-title-s">Гонка множителей</div>
            <p className="lobby-hero__note">
              Призовой 500 000 ₽ делится между первой сотней. Считается сумма
              множителей, а не ставок.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
