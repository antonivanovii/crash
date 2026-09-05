import { GAMES, GameArt, catalogEntry, type GameSlug } from '@/entities/game';
import { Button, Sheet, StatRow } from '@kobold/ui';
import { Link } from '@tanstack/react-router';
import './game-sheet.css';

/**
 * Карточка игры на мобильном.
 *
 * Открывается вместо перехода: с 390px игрок должен сначала увидеть лимиты
 * и честность, а уже потом решить. На десктопе карточка кликается напрямую —
 * там эти данные помещаются на экране игры.
 */
export function GameSheet({ slug, onClose }: { slug: GameSlug | null; onClose: () => void }) {
  if (!slug) return null;

  const game = GAMES[slug];
  const entry = catalogEntry(slug);

  return (
    <Sheet open onClose={onClose}>
      <div className="game-sheet__head">
        <GameArt slug={slug} className="game-sheet__art" />
        <div className="game-sheet__title">
          <div className="kb-title-s">{game.title}</div>
          <div className="game-sheet__meta kb-num">{entry.rtp} · свой движок</div>
        </div>
      </div>

      <div className="game-sheet__stats">
        <div className="game-sheet__stat">
          <span className="kb-caption">Мин. ставка</span>
          <span className="kb-money">10 ₽</span>
        </div>
        <div className="game-sheet__stat">
          <span className="kb-caption">Макс. множитель</span>
          <span className="kb-money">1 000 000×</span>
        </div>
      </div>

      <div className="game-sheet__fairness">
        <span className="game-sheet__check" aria-hidden>
          ✓
        </span>
        <p>
          Результат считается из сида, опубликованного до раунда. Пересчитать можно{' '}
          <Link to="/fairness/verify">в верификаторе</Link>.
        </p>
      </div>

      <StatRow label="Сыграно сегодня" value={entry.plays} className="game-sheet__plays" />

      <div className="game-sheet__actions">
        <Link to="/casino/$gameSlug" params={{ gameSlug: slug }} className="game-sheet__play">
          <Button size="xl" block>
            Играть
          </Button>
        </Link>
        <Button variant="secondary" size="xl" aria-label="В избранное">
          ☆
        </Button>
      </div>
    </Sheet>
  );
}
