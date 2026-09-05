import {
  CATEGORIES,
  GAMES,
  SORTS,
  GameCard,
  GameCardSoon,
  catalogEntry,
  matchesCategory,
  sortGames,
  type GameCategory,
  type GameSort,
  type GameSlug,
} from '@/entities/game';
import { useRoundStore } from '@/entities/round';
import { useIsMobile } from '@/shared/lib';
import { SidebarSlot } from '@/shared/ui';
import { CasinoSidebar } from '@/widgets/casino-sidebar';
import { LobbyHero } from '@/widgets/lobby-hero';
import { WinFeed } from '@/widgets/win-feed';
import { Alert, Button, Card, Chip, SectionHeader, Select } from '@kobold/ui';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { GameSheet } from './GameSheet.js';
import './casino-lobby.css';

/**
 * Лобби.
 *
 * Живых столов здесь нет: это видеотрансляция с реальным дилером, а каталог
 * состоит только из своих игр со своим движком и проверяемым результатом.
 *
 * Состояние идущих раундов показывается статикой. Живое превью требует
 * подписки на сводный канал, а не на комнату каждой игры, — иначе лобби
 * открывает семь соединений; канал появится вместе с оркестратором crash.
 */
const AVAILABLE_ON_MOBILE = 6;

export function CasinoLobbyPage() {
  const isMobile = useIsMobile();
  const [category, setCategory] = useState<GameCategory>('all');
  const [sort, setSort] = useState<GameSort>('popular');
  const [sheetGame, setSheetGame] = useState<GameSlug | null>(null);
  // Селектор обязан возвращать стабильную ссылку: Object.values() создаёт новый
  // массив на каждый снимок, и useSyncExternalStore уходит в бесконечный цикл.
  const openRoundsByGame = useRoundStore((s) => s.openRounds);
  const openRounds = Object.values(openRoundsByGame);

  // Каталог показывается целиком: неподключённая игра гасится карточкой,
  // а не прячется. Иначе лобби выглядит пустым, пока игры пишутся одна за другой.
  const slugs = sortGames(
    (Object.keys(GAMES) as GameSlug[]).filter((slug) => matchesCategory(slug, category)),
    sort,
  );
  const shown = isMobile ? slugs.slice(0, AVAILABLE_ON_MOBILE) : slugs;

  return (
    <>
      <SidebarSlot>
        <CasinoSidebar category={category} onCategoryChange={setCategory} />
      </SidebarSlot>

      <div className="page lobby">
        <LobbyHero />

        {/* На мобильном фильтры — единственная навигация по каталогу. */}
        <div className="lobby__filters">
          {CATEGORIES.map((item) => (
            <Chip
              key={item.id}
              selected={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </Chip>
          ))}
          {isMobile ? null : (
            <Select
              className="lobby__sort"
              size="m"
              value={sort}
              onChange={setSort}
              options={SORTS.map((option) => ({ value: option.id, label: option.label }))}
              aria-label="Сортировка"
            />
          )}
        </div>

        <section>
          <SectionHeader
            title="Оригиналы Kobold"
            subtitle="свой движок, результат проверяется в браузере"
            action={<Link to="/casino/history">Все {slugs.length} →</Link>}
          />
          <div className="lobby__grid">
            {shown.map((slug) => {
              const entry = catalogEntry(slug);
              const available = GAMES[slug].available;

              // Недоступная игра не ведёт никуда: карточка остаётся div'ом,
              // чтобы клавиатурная навигация не останавливалась на пустышке.
              return (
                <GameCard
                  key={slug}
                  slug={slug}
                  title={GAMES[slug].title}
                  rtp={entry.rtp}
                  plays={entry.plays}
                  promo={entry.promo}
                  soon={!available}
                  as={!available ? 'div' : isMobile ? 'button' : Link}
                  {...(!available
                    ? {}
                    : isMobile
                      ? { type: 'button', onClick: () => setSheetGame(slug) }
                      : { to: '/casino/$gameSlug', params: { gameSlug: slug } })}
                />
              );
            })}
            {isMobile ? null : <GameCardSoon title="HiLo" note="осень" />}
          </div>
        </section>

        <div className="lobby__bottom">
          <WinFeed />

          <div className="lobby__aside">
            <Card className="lobby__continue">
              <div className="kb-title-s">Продолжить</div>
              {openRounds.length > 0 ? (
                openRounds.map((round) => (
                  <Link
                    key={round.game}
                    to="/casino/$gameSlug"
                    params={{ gameSlug: round.game }}
                    className="lobby__continue-row"
                  >
                    <span className="lobby__continue-art">
                      <GameCard slug={round.game} title="" className="lobby__continue-thumb" />
                    </span>
                    <span className="lobby__continue-body">
                      <span className="lobby__continue-title">
                        {GAMES[round.game].title} · раунд открыт
                      </span>
                      <span className="lobby__continue-note kb-num">шаг {round.step}</span>
                    </span>
                    <Button size="s">Открыть</Button>
                  </Link>
                ))
              ) : (
                <p className="lobby__empty">
                  Брошенных раундов нет. Незавершённая игра появится здесь и переживёт
                  перезагрузку.
                </p>
              )}
            </Card>

            {/* Ответственная игра: блок обязателен, а не опционален. */}
            <Alert tone="danger" title="Лимит сессии — 60 минут">
              Идёт 48-я минута. За пять минут до конца предупредим, потом закроем вход
              до 09:00. Открытые раунды доиграются.
            </Alert>
          </div>
        </div>
      </div>

      <GameSheet slug={sheetGame} onClose={() => setSheetGame(null)} />
    </>
  );
}
